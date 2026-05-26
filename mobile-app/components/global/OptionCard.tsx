import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import { useColors, alpha } from '@/hooks/useTheme';

interface Props {
  icon: string;
  bgColor: string;
  iconColor: string;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

export default function OptionCard({
  icon,
  bgColor,
  iconColor,
  label,
  description,
  selected,
  onPress,
}: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`flex-row items-center gap-4 p-4 rounded-2xl`,
        {
          borderWidth: 2,
          borderColor: selected
            ? colors.primary
            : pressed
              ? alpha(colors.primary, 0.3)
              : 'transparent',
          backgroundColor: selected
            ? alpha(colors.primary, 0.12)
            : colors.appCard,
        },
      ]}
    >
      <View
        style={[
          tw`w-11 h-11 rounded-xl items-center justify-center shrink-0`,
          { backgroundColor: bgColor },
        ]}
      >
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>

      <View style={tw`flex-1`}>
        <Text medium size={15}>
          {label}
        </Text>
        <Text secondary size={13} style={tw`mt-0.5 leading-5`}>
          {description}
        </Text>
      </View>

      <View
        style={[
          tw`w-5 h-5 rounded-full shrink-0 items-center justify-center`,
          {
            borderWidth: 2,
            borderColor: selected
              ? colors.primary
              : alpha(colors.appTextSecondary, 0.4),
            backgroundColor: selected ? colors.primary : 'transparent',
          },
        ]}
      >
        {selected && <View style={tw`w-2 h-2 rounded-full bg-white`} />}
      </View>
    </Pressable>
  );
}
