import { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  addFile,
  removeFile,
  clearFiles,
  setCollectionId,
  setUploadStatus,
  setUploadError,
} from '@/redux/slices/uploadSlice';
import tw from '@/lib/tw';
import Screen from '@/components/global/Screen';
import Header from '@/components/global/Header';
import { Text } from '@/components/global/Themed';
import StepBadge from '@/components/global/StepBadge';
import ProgressBar from '@/components/global/ProgressBar';
import InfoList from '@/components/global/InfoList';
import Btn from '@/components/global/Btn';
import { useColors, alpha } from '@/hooks/useTheme';
import { StoredFileMeta } from '@/types';
import {
  formatFileSize,
  fileExtension,
  extColor,
  extBgColor,
} from '@/lib/storage';
import { uploadFiles } from '@/lib/api';
import { ACCEPTED_MIME_TYPES, MAX_FILES } from '@/lib/features';

// Preview helpers

function getExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function mdToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = escaped
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .split(/\n\n+/)
    .map((b) =>
      /^<(h[1-3]|ul|hr)/.test(b.trim())
        ? b
        : `<p>${b.replace(/\n/g, '<br/>')}</p>`,
    )
    .join('\n');
  return `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,sans-serif;font-size:15px;line-height:1.7;padding:20px;color:#313e51}h1,h2{color:#a729f5}code{background:#f4f6fa;padding:2px 6px;border-radius:4px;font-family:monospace}ul{padding-left:20px}hr{border:none;border-top:1px solid #ddd;margin:16px 0}</style></head><body>${html}</body></html>`;
}

// File preview modal

function FilePreviewModal({
  file,
  onClose,
}: {
  file: StoredFileMeta;
  onClose: () => void;
}) {
  const colors = useColors();
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const ext = getExt(file.name);
  const isTxt = ext === 'txt' || ext === 'md';
  const isPdf = ext === 'pdf';

  useState(() => {
    if (isTxt) {
      FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      })
        .then((content) => {
          setText(content);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  });

  const handleCopy = async () => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Modal
      visible
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[tw`flex-1`, { backgroundColor: colors.appBg }]}
        edges={['top', 'left', 'right']}
      >
        <View
          style={[
            tw`flex-row items-center gap-3 px-5 py-3 border-b`,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.appCard,
            },
          ]}
        >
          <View
            style={[
              tw`w-9 h-9 rounded-xl items-center justify-center shrink-0`,
              { backgroundColor: extBgColor(file.name) },
            ]}
          >
            <Text bold size={10} style={{ color: extColor(file.name) }}>
              {fileExtension(file.name)}
            </Text>
          </View>

          <View style={tw`flex-1 min-w-0`}>
            <Text medium size={14} numberOfLines={1}>
              {file.name}
            </Text>
            <Text secondary size={12} style={tw`mt-0.5`}>
              {formatFileSize(file.size)}
            </Text>
          </View>

          {isTxt && text && (
            <Pressable
              onPress={handleCopy}
              style={[
                tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full`,
                {
                  borderWidth: 1.5,
                  backgroundColor: copied
                    ? alpha(colors.success, 0.14)
                    : alpha(colors.primary, 0.1),
                  borderColor: copied
                    ? alpha(colors.success, 0.4)
                    : alpha(colors.primary, 0.3),
                },
              ]}
            >
              <Ionicons
                name={copied ? 'checkmark-outline' : 'copy-outline'}
                size={13}
                color={copied ? colors.success : colors.primary}
              />
              <Text
                medium
                size={12}
                style={{ color: copied ? colors.success : colors.primary }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={onClose}
            style={[
              tw`w-8 h-8 rounded-full items-center justify-center`,
              { backgroundColor: alpha(colors.appTextSecondary, 0.1) },
            ]}
          >
            <Ionicons name='close' size={20} color={colors.appTextSecondary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator color={colors.primary} size='large' />
          </View>
        ) : isPdf ? (
          <WebView
            source={{ uri: file.uri }}
            style={tw`flex-1`}
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
          />
        ) : ext === 'md' && text ? (
          <WebView source={{ html: mdToHtml(text) }} style={tw`flex-1`} />
        ) : text ? (
          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-5`}>
            <Text selectable size={14} style={tw`leading-6`}>
              {text}
            </Text>
          </ScrollView>
        ) : (
          <View style={tw`flex-1 items-center justify-center p-8 gap-4`}>
            <Ionicons
              name='alert-circle-outline'
              size={48}
              color={colors.appTextSecondary}
            />
            <Text medium size={16}>
              Preview unavailable
            </Text>
            <Text secondary size={13} style={tw`text-center`}>
              This file type cannot be previewed in the app.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// File row

function FileRow({
  file,
  onPreview,
  onRemove,
}: {
  file: StoredFileMeta;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPreview}
      style={({ pressed }) => [
        tw`flex-row items-center gap-3 rounded-2xl px-4 py-3.5`,
        {
          backgroundColor: colors.appCard,
          borderWidth: 1.5,
          borderColor: pressed ? alpha(colors.primary, 0.4) : colors.border,
        },
      ]}
    >
      <View
        style={[
          tw`w-9 h-9 rounded-xl items-center justify-center shrink-0`,
          { backgroundColor: extBgColor(file.name) },
        ]}
      >
        <Text bold size={10} style={{ color: extColor(file.name) }}>
          {fileExtension(file.name)}
        </Text>
      </View>

      <View style={tw`flex-1 min-w-0`}>
        <Text medium size={14} numberOfLines={1}>
          {file.name}
        </Text>
        <Text secondary size={12} style={tw`mt-0.5`}>
          {formatFileSize(file.size)}
        </Text>
        <View
          style={[
            tw`mt-1.5 h-0.5 rounded-full overflow-hidden`,
            { backgroundColor: alpha(colors.appText, 0.08) },
          ]}
        >
          <View
            style={[
              tw`h-full w-full rounded-full`,
              { backgroundColor: colors.primary },
            ]}
          />
        </View>
      </View>

      <View style={tw`flex-row items-center gap-1 mr-1`}>
        <Ionicons
          name='eye-outline'
          size={13}
          color={alpha(colors.primary, 0.7)}
        />
        <Text size={12} style={{ color: alpha(colors.primary, 0.7) }}>
          Preview
        </Text>
      </View>

      <Pressable
        onPress={onRemove}
        hitSlop={8}
        style={tw`w-7 h-7 items-center justify-center rounded-lg`}
      >
        <Ionicons
          name='close-outline'
          size={18}
          color={colors.appTextSecondary}
        />
      </Pressable>
    </Pressable>
  );
}

// Main screen

export default function Upload() {
  const dispatch = useDispatch();
  const colors = useColors();
  const { files, status, error } = useSelector(
    (state: RootState) => state.upload,
  );
  const [previewFile, setPreviewFile] = useState<StoredFileMeta | null>(null);

  const hasFiles = files.length > 0;
  const canAddMore = hasFiles && files.length < MAX_FILES;

  const pickFile = async () => {
    if (files.length >= MAX_FILES) {
      Alert.alert('Limit reached', 'Up to 2 files per session.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_MIME_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      dispatch(
        addFile({
          name: asset.name,
          size: asset.size ?? 0,
          type: asset.mimeType ?? '',
          uri: asset.uri,
          source: 'upload',
        }),
      );
    } catch {
      Alert.alert('Error', 'Could not open file picker.');
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;
    dispatch(setUploadStatus('uploading'));
    dispatch(setUploadError(null));
    try {
      const result = await uploadFiles(files);
      dispatch(setCollectionId(result.collection_id));
      dispatch(setUploadStatus('done'));
    } catch (err: any) {
      dispatch(setUploadError(err.message ?? 'Upload failed'));
      dispatch(setUploadStatus('error'));
    }
  };

  return (
    <Screen>
      <Header />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <StepBadge label='Step 1 of 3' />
        <Text size={34} style={{ lineHeight: 44 }}>
          Upload your{'\n'}
          <Text bold size={34} style={{ lineHeight: 44 }}>
            documents.
          </Text>
        </Text>
        <Text secondary size={13} style={tw`italic mt-2 mb-7 leading-5`}>
          Add the files you want to use. We'll do the rest.
        </Text>

        <InfoList
          items={[
            '<strong>Multiple files supported</strong> — upload up to 2 documents.',
            '<strong>PDF, DOCX, TXT, MD</strong> accepted. Max 10 MB per file.',
            'Content is <strong>processed privately</strong> and not stored after your session.',
          ]}
        />

        <View style={tw`mt-7`}>
          <ProgressBar value={33} />
        </View>

        {!hasFiles && (
          <Pressable
            onPress={pickFile}
            style={({ pressed }) => [
              tw`border-2 rounded-2xl py-11 items-center gap-3 mb-4`,
              {
                borderStyle: 'dashed',
                borderColor: pressed
                  ? colors.primary
                  : alpha(colors.appTextSecondary, 0.3),
                backgroundColor: pressed
                  ? alpha(colors.primary, 0.06)
                  : 'transparent',
              },
            ]}
          >
            <View
              style={[
                tw`w-14 h-14 rounded-2xl items-center justify-center`,
                { backgroundColor: alpha(colors.primary, 0.15) },
              ]}
            >
              <Ionicons
                name='cloud-upload-outline'
                size={30}
                color={colors.primary}
              />
            </View>
            <Text medium size={15}>
              Tap to pick a file
            </Text>
            <Text secondary size={13}>
              PDF · DOCX · TXT · MD · up to 10 MB
            </Text>
          </Pressable>
        )}

        {hasFiles && (
          <View style={tw`gap-2.5 mb-3`}>
            {files.map((file, index) => (
              <FileRow
                key={index}
                file={file}
                onPreview={() => setPreviewFile(file)}
                onRemove={() => dispatch(removeFile(index))}
              />
            ))}
            <View style={tw`flex-row items-center justify-center gap-1.5 mt-1`}>
              <Ionicons
                name='information-circle-outline'
                size={13}
                color={alpha(colors.appTextSecondary, 0.5)}
              />
              <Text
                size={12}
                style={{ color: alpha(colors.appTextSecondary, 0.5) }}
              >
                Tap a file to preview its contents
              </Text>
            </View>
          </View>
        )}

        {canAddMore && (
          <>
            <View style={tw`flex-row items-center gap-3 my-2`}>
              <View
                style={[
                  tw`flex-1 h-px`,
                  { backgroundColor: alpha(colors.appTextSecondary, 0.12) },
                ]}
              />
              <Text secondary size={12}>
                or add more
              </Text>
              <View
                style={[
                  tw`flex-1 h-px`,
                  { backgroundColor: alpha(colors.appTextSecondary, 0.12) },
                ]}
              />
            </View>
            <Pressable
              onPress={pickFile}
              style={({ pressed }) => [
                tw`flex-row items-center justify-center rounded-2xl py-3.5 mb-2`,
                {
                  borderWidth: 1,
                  borderColor: alpha(colors.appTextSecondary, 0.2),
                  backgroundColor: pressed
                    ? alpha(colors.appText, 0.05)
                    : 'transparent',
                },
              ]}
            >
              <Text secondary size={14}>
                + Add another document
              </Text>
            </Pressable>
          </>
        )}

        {status === 'done' && (
          <View
            style={[
              tw`flex-row items-center gap-2.5 rounded-2xl p-3.5 mb-3`,
              {
                backgroundColor: alpha(colors.success, 0.12),
                borderWidth: 1,
                borderColor: alpha(colors.success, 0.3),
              },
            ]}
          >
            <Ionicons
              name='checkmark-circle'
              size={20}
              color={colors.success}
            />
            <Text medium size={13} style={{ color: colors.success }}>
              Files uploaded & indexed!
            </Text>
          </View>
        )}

        {status === 'error' && error && (
          <View
            style={[
              tw`flex-row items-center gap-2.5 rounded-2xl p-3.5 mb-3`,
              {
                backgroundColor: alpha(colors.error, 0.1),
                borderWidth: 1,
                borderColor: alpha(colors.error, 0.3),
              },
            ]}
          >
            <Ionicons
              name='alert-circle-outline'
              size={18}
              color={colors.error}
            />
            <Text size={13} style={{ color: colors.error, flex: 1 }}>
              {error}
            </Text>
          </View>
        )}

        {hasFiles && status !== 'done' && (
          <View style={tw`mt-1`}>
            <Btn
              label={
                status === 'uploading'
                  ? 'Uploading…'
                  : `Continue (${files.length} file${files.length !== 1 ? 's' : ''})`
              }
              onPress={handleUpload}
              loading={status === 'uploading'}
            />
          </View>
        )}

        <View style={tw`flex-row items-center justify-center gap-1.5 mt-4`}>
          <Ionicons
            name='information-circle-outline'
            size={13}
            color={colors.appTextSecondary}
          />
          <Text secondary size={12}>
            Max 2 documents per session
          </Text>
        </View>

        {hasFiles && (
          <Pressable
            onPress={() => dispatch(clearFiles())}
            style={tw`items-center py-3 mt-1`}
          >
            <Text secondary size={13}>
              Clear all files
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </Screen>
  );
}
