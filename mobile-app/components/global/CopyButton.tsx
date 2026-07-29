import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/global/Themed';
import { useColors, alpha } from '@/hooks/useTheme';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import tw from '@/lib/tw';

interface CopyButtonProps {
  /** Text copied to the clipboard on press. */
  text: string;
  /** Label shown in the idle state. Default: 'Copy' */
  label?: string;
  /** Label shown right after a successful copy. Default: 'Copied' */
  copiedLabel?: string;
  /**
   * 'subtle' — neutral bordered pill (used on the summary screen).
   * 'pill' — filled primary/success pill (used in the upload file preview).
   */
  variant?: 'subtle' | 'pill';
}

/**
 * Reusable "Copy to clipboard" button for the mobile app. Wraps
 * useCopyToClipboard so the Clipboard-writing logic lives in one place
 * instead of being re-implemented per screen.
 */
export default function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  variant = 'subtle',
}: CopyButtonProps) {
  const colors = useColors();
  const { state, copy } = useCopyToClipboard();
  const copied = state === 'copied';
  const iconName = copied ? 'checkmark-outline' : 'copy-outline';

  if (variant === 'pill') {
    return (
      <Pressable
        onPress={() => copy(text)}
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
          name={iconName}
          size={13}
          color={copied ? colors.success : colors.primary}
        />
        <Text medium size={12} style={{ color: copied ? colors.success : colors.primary }}>
          {copied ? copiedLabel : label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => copy(text)}
      style={({ pressed }) => [
        tw`flex-row items-center gap-1.5 rounded-lg px-3 py-1.5`,
        {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: pressed ? alpha(colors.appText, 0.05) : 'transparent',
        },
      ]}
    >
      <Ionicons name={iconName} size={14} color={colors.appTextSecondary} />
      <Text secondary size={12}>
        {copied ? copiedLabel : label}
      </Text>
    </Pressable>
  );
}