import { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import tw from '@/lib/tw';
import Screen from '@/components/global/Screen';
import Header from '@/components/global/Header';
import { Text } from '@/components/global/Themed';
import StepBadge from '@/components/global/StepBadge';
import ProgressBar from '@/components/global/ProgressBar';
import InfoList from '@/components/global/InfoList';
import OptionCard from '@/components/global/OptionCard';
import Btn from '@/components/global/Btn';
import Card from '@/components/global/Card';
import { useColors, alpha } from '@/hooks/useTheme';
import { SummaryLength, SummaryStyle } from '@/types';
import { LENGTH_OPTIONS, STYLE_OPTIONS } from '@/lib/summary-options';
import { generateSummaryApi, SummaryApiResponse } from '@/lib/api';

type Step = 'length' | 'style' | 'result';

export default function Summary() {
  const colors = useColors();
  const { files } = useSelector((state: RootState) => state.upload);

  const [step, setStep] = useState<Step>('length');
  const [length, setLength] = useState<SummaryLength | null>('medium');
  const [style, setStyle] = useState<SummaryStyle | null>('combined');
  const [result, setResult] = useState<SummaryApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docIndex, setDocIndex] = useState(0);

  const isMultiDoc = files.length > 1;
  const hasFiles = files.length > 0;

  const generate = async (chosenStyle?: SummaryStyle) => {
    setLoading(true);
    setError(null);
    try {
      const apiStyle = !isMultiDoc
        ? 'default'
        : (chosenStyle ?? style ?? 'combined');
      const data = await generateSummaryApi(files, length!, apiStyle);
      setResult(data);
      setStep('result');
    } catch (err: any) {
      setError(err.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setStep('length');
    setDocIndex(0);
  };

  // Result step
  if (step === 'result') {
    const isDocByDoc = result?.style === 'doc-by-doc';
    const current = result?.summaries[docIndex];
    return (
      <Screen>
        <Header />
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-6 pb-8`}
          showsVerticalScrollIndicator={false}
        >
          <StepBadge
            label={
              isDocByDoc
                ? 'Doc-by-doc'
                : isMultiDoc
                  ? 'Combined Summary'
                  : 'Summary'
            }
          />
          <Text size={34} style={{ lineHeight: 44 }}>
            Here's your{'\n'}
            <Text bold size={34} style={{ lineHeight: 44 }}>
              {length} summary.
            </Text>
          </Text>
          <Text secondary size={13} style={tw`italic mt-2 mb-6 leading-5`}>
            {isDocByDoc
              ? `Browsing ${files.length} documents one at a time.`
              : isMultiDoc
                ? `Unified summary across all ${files.length} documents.`
                : 'Your document has been summarised below.'}
          </Text>

          {result?.fallback && (
            <View
              style={[
                tw`rounded-2xl p-3.5 mb-5`,
                {
                  backgroundColor: alpha('#f59e0b', 0.1),
                  borderWidth: 1,
                  borderColor: alpha('#f59e0b', 0.3),
                },
              ]}
            >
              <Text size={13} style={tw`leading-5`}>
                <Text medium size={13}>
                  Documents appear unrelated.{' '}
                </Text>
                Switched to Doc-by-doc automatically.
              </Text>
            </View>
          )}

          {isDocByDoc && result && (
            <View
              style={[
                tw`flex-row items-center justify-between rounded-2xl p-3.5 mb-4`,
                { backgroundColor: colors.appCard },
              ]}
            >
              <Pressable
                onPress={() => setDocIndex((i) => Math.max(0, i - 1))}
                disabled={docIndex === 0}
                style={[
                  tw`w-9 h-9 items-center justify-center rounded-xl`,
                  {
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: docIndex === 0 ? 0.3 : 1,
                  },
                ]}
              >
                <Ionicons
                  name='chevron-back'
                  size={18}
                  color={colors.appText}
                />
              </Pressable>
              <Text
                medium
                size={14}
                numberOfLines={1}
                style={tw`flex-1 text-center mx-3`}
              >
                {result.summaries[docIndex]?.doc_name}
              </Text>
              <Pressable
                onPress={() =>
                  setDocIndex((i) =>
                    Math.min((result?.summaries.length ?? 1) - 1, i + 1),
                  )
                }
                disabled={docIndex >= (result?.summaries.length ?? 1) - 1}
                style={[
                  tw`w-9 h-9 items-center justify-center rounded-xl`,
                  {
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity:
                      docIndex >= (result?.summaries.length ?? 1) - 1 ? 0.3 : 1,
                  },
                ]}
              >
                <Ionicons
                  name='chevron-forward'
                  size={18}
                  color={colors.appText}
                />
              </Pressable>
            </View>
          )}

          {loading ? (
            <View style={tw`items-center py-12`}>
              <ActivityIndicator color={colors.primary} size='large' />
              <Text secondary size={14} style={tw`mt-4`}>
                Generating your summary…
              </Text>
            </View>
          ) : error ? (
            <View
              style={[
                tw`rounded-2xl p-4 mb-4`,
                {
                  backgroundColor: alpha(colors.error, 0.1),
                  borderWidth: 1,
                  borderColor: alpha(colors.error, 0.3),
                },
              ]}
            >
              <Text size={13} style={{ color: colors.error }}>
                {error}
              </Text>
            </View>
          ) : current ? (
            <Card style={tw`mb-5`}>
              {!isDocByDoc && isMultiDoc && (
                <Text
                  medium
                  size={14}
                  style={[tw`mb-3`, { color: colors.primary }]}
                >
                  {current.doc_name}
                </Text>
              )}
              <Text size={15} style={tw`leading-7`}>
                {current.summary}
              </Text>
            </Card>
          ) : null}

          <View
            style={[
              tw`flex-row items-center gap-3.5 rounded-2xl p-5 mb-4`,
              {
                backgroundColor: alpha(colors.success, 0.1),
                borderWidth: 1,
                borderColor: alpha(colors.success, 0.25),
              },
            ]}
          >
            <View
              style={[
                tw`w-11 h-11 rounded-xl items-center justify-center`,
                { backgroundColor: alpha(colors.success, 0.15) },
              ]}
            >
              <Ionicons name='brain-outline' size={22} color={colors.success} />
            </View>
            <View style={tw`flex-1`}>
              <Text medium size={14}>
                Ready to test yourself?
              </Text>
              <Text secondary size={12} style={tw`mt-0.5`}>
                Quiz yourself on this material
              </Text>
            </View>
            <Ionicons
              name='chevron-forward'
              size={18}
              color={colors.appTextSecondary}
            />
          </View>

          <Pressable
            onPress={reset}
            style={({ pressed }) => [
              tw`flex-row items-center justify-center gap-2 rounded-2xl py-3.5`,
              {
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed
                  ? alpha(colors.appText, 0.05)
                  : 'transparent',
              },
            ]}
          >
            <Ionicons
              name='refresh-outline'
              size={14}
              color={colors.appTextSecondary}
            />
            <Text secondary size={13}>
              Use different settings
            </Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  // Style step
  if (step === 'style') {
    return (
      <Screen>
        <Header />
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-6 pb-8`}
          showsVerticalScrollIndicator={false}
        >
          <ProgressBar value={83} />
          <StepBadge label='Step 3 of 3' />
          <Text size={34} style={{ lineHeight: 44 }}>
            How should we{'\n'}
            <Text bold size={34} style={{ lineHeight: 44 }}>
              present it?
            </Text>
          </Text>
          <Text secondary size={13} style={tw`italic mt-2 mb-7 leading-5`}>
            You've uploaded {files.length} documents. Choose how you'd like the
            summary laid out.
          </Text>
          <InfoList
            items={[
              '<strong>Combined</strong> weaves all documents into one coherent summary.',
              '<strong>Doc-by-doc</strong> gives each document its own summary to browse.',
            ]}
          />
          <View style={tw`mt-7 gap-3`}>
            {STYLE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                icon={option.icon}
                bgColor={option.bgColor}
                iconColor={option.iconColor}
                label={option.label}
                description={option.description}
                selected={style === option.value}
                onPress={() => setStyle(option.value)}
              />
            ))}
          </View>
          <View style={tw`mt-5`}>
            <Btn
              label='Generate Summary'
              onPress={() => generate(style!)}
              disabled={!style}
              loading={loading}
            />
          </View>
          <Pressable
            onPress={() => setStep('length')}
            style={tw`items-center py-3.5`}
          >
            <Text secondary size={13}>
              ← Change length
            </Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  // Length step (default)
  return (
    <Screen>
      <Header />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <ProgressBar value={66} />
        <StepBadge label={`Step 2 of ${isMultiDoc ? 3 : 2}`} />
        <Text size={34} style={{ lineHeight: 44 }}>
          How detailed{'\n'}
          <Text bold size={34} style={{ lineHeight: 44 }}>
            should it be?
          </Text>
        </Text>
        <Text secondary size={13} style={tw`italic mt-2 mb-7 leading-5`}>
          Choose the level of detail. You can always generate another.
        </Text>

        {!hasFiles && (
          <View
            style={[
              tw`rounded-2xl p-3.5 mb-6`,
              {
                backgroundColor: alpha('#f59e0b', 0.1),
                borderWidth: 1,
                borderColor: alpha('#f59e0b', 0.3),
              },
            ]}
          >
            <Text medium size={13} style={tw`mb-1`}>
              No documents uploaded
            </Text>
            <Text secondary size={13}>
              Go to the Upload tab to add your documents first.
            </Text>
          </View>
        )}

        <InfoList
          items={[
            '<strong>Short</strong> — great for a quick refresher.',
            '<strong>Medium</strong> — key arguments without the noise.',
            '<strong>Long</strong> — every argument, example, and conclusion.',
          ]}
        />
        <View style={tw`mt-7 gap-3`}>
          {LENGTH_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              icon={option.icon}
              bgColor={option.bgColor}
              iconColor={option.iconColor}
              label={option.label}
              description={option.description}
              selected={length === option.value}
              onPress={() => setLength(option.value)}
            />
          ))}
        </View>
        <View style={tw`mt-5`}>
          <Btn
            label={isMultiDoc ? 'Continue' : 'Generate Summary'}
            onPress={() => (isMultiDoc ? setStep('style') : generate())}
            disabled={!length || !hasFiles}
            loading={loading && !isMultiDoc}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
