import { useState } from 'react';
import { View, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { clearFiles } from '@/redux/slices/uploadSlice';
import { resetQuizForFileChange } from '@/redux/slices/quizSlice';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import { useColors, alpha } from '@/hooks/useTheme';

type PendingAction = 'change' | 'remove' | null;

export default function FileActionsMenu() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useDispatch();
  const { files } = useSelector((state: RootState) => state.upload);

  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);

  const hasFiles = files.length > 0;

  const openMenu = () => {
    if (!hasFiles) {
      // Nothing to lose — just go straight to the picker.
      router.push('/(tabs)/upload');
      return;
    }
    setMenuOpen(true);
  };

  const requestAction = (action: PendingAction) => {
    setMenuOpen(false);
    setPending(action);
  };

  const confirm = () => {
    const action = pending;
    setPending(null);
    // Wipes files/collectionId (and bumps fileVersion, which Summary/Chat
    // watch to reset themselves) and puts the quiz options back on their
    // first choice.
    dispatch(clearFiles());
    dispatch(resetQuizForFileChange());
    if (action === 'change') {
      router.push('/(tabs)/upload');
    }
  };

  const cancel = () => setPending(null);

  return (
    <View>
      <Pressable
        onPress={openMenu}
        hitSlop={8}
        style={({ pressed }) => [
          tw`w-9 h-9 rounded-full items-center justify-center`,
          { backgroundColor: alpha(colors.appTextSecondary, pressed ? 0.18 : 0.1) },
        ]}
      >
        <Ionicons
          name={hasFiles ? 'ellipsis-horizontal' : 'cloud-upload-outline'}
          size={18}
          color={colors.appText}
        />
      </Pressable>

      {/* Dropdown menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType='fade'
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={tw`flex-1`}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={[
              tw`absolute top-16 right-5 rounded-2xl py-1.5 w-48`,
              {
                backgroundColor: colors.appCard,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 10,
              },
            ]}
          >
            <Pressable
              onPress={() => requestAction('change')}
              style={({ pressed }) => [
                tw`flex-row items-center gap-3 px-4 py-3`,
                { backgroundColor: pressed ? alpha(colors.appText, 0.06) : 'transparent' },
              ]}
            >
              <Ionicons name='swap-horizontal-outline' size={17} color={colors.appText} />
              <Text medium size={14}>Change files</Text>
            </Pressable>

            <View style={[tw`h-px mx-2`, { backgroundColor: colors.border }]} />

            <Pressable
              onPress={() => requestAction('remove')}
              style={({ pressed }) => [
                tw`flex-row items-center gap-3 px-4 py-3`,
                { backgroundColor: pressed ? alpha(colors.error, 0.08) : 'transparent' },
              ]}
            >
              <Ionicons name='trash-outline' size={17} color={colors.error} />
              <Text medium size={14} style={{ color: colors.error }}>Remove files</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Confirm modal */}
      <Modal
        visible={pending !== null}
        transparent
        animationType='fade'
        onRequestClose={cancel}
      >
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <Pressable
            style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
            onPress={cancel}
          />
          <View
            style={[
              tw`w-full max-w-sm rounded-3xl p-6`,
              { backgroundColor: colors.appCard },
            ]}
          >
            <View
              style={[
                tw`w-12 h-12 rounded-2xl items-center justify-center mb-4`,
                { backgroundColor: alpha('#fbbf24', 0.15) },
              ]}
            >
              <Ionicons name='warning-outline' size={24} color='#fbbf24' />
            </View>

            <Text bold size={18} style={tw`mb-2`}>
              Are you sure?
            </Text>
            <Text secondary size={13} style={tw`leading-5 mb-6`}>
              {pending === 'remove'
                ? "Removing your file(s) will erase your current summary, chat, and quiz progress — you'll start fresh."
                : 'Changing files will erase your current summary, chat, and quiz progress — you\'ll start fresh with the new file(s).'}
            </Text>

            <View style={tw`flex-row gap-3`}>
              <Pressable
                onPress={cancel}
                style={[
                  tw`flex-1 py-3.5 rounded-xl items-center justify-center`,
                  { borderWidth: 1.5, borderColor: alpha(colors.appTextSecondary, 0.25) },
                ]}
              >
                <Text medium size={14}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                style={[
                  tw`flex-1 py-3.5 rounded-xl items-center justify-center`,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text medium size={14} style={{ color: '#fff' }}>
                  {pending === 'remove' ? 'Remove' : 'Proceed'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
