import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import { useColors, alpha } from '@/hooks/useTheme';
import { MCQOption } from '@/types';

interface Props {
  options:      MCQOption[];
  selectedIndex: number | null;
  correctIndex?: number;
  submitted:    boolean;
  onSelect:     (index: number) => void;
}

export default function MCQOptions({ options, selectedIndex, correctIndex, submitted, onSelect }: Props) {
  const colors = useColors();

  return (
    <View style={tw`gap-3`}>
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect  = submitted && correctIndex === index;
        const isWrong    = submitted && isSelected && correctIndex !== index;

        const borderColor = isCorrect
          ? colors.success
          : isWrong
          ? colors.error
          : isSelected
          ? colors.primary
          : colors.border;

        const backgroundColor = isCorrect
          ? alpha(colors.success, 0.12)
          : isWrong
          ? alpha(colors.error, 0.10)
          : isSelected
          ? alpha(colors.primary, 0.12)
          : 'transparent';

        const badgeBg = isCorrect
          ? colors.success
          : isWrong
          ? colors.error
          : isSelected
          ? colors.primary
          : alpha(colors.appTextSecondary, 0.12);

        const badgeTextColor = isCorrect || isWrong || isSelected ? '#fff' : colors.appTextSecondary;

        return (
          <Pressable
            key={option.letter}
            disabled={submitted}
            onPress={() => onSelect(index)}
            style={[
              tw`flex-row items-center gap-4 p-4 rounded-2xl`,
              { borderWidth: 2, borderColor, backgroundColor, opacity: submitted && !isCorrect && !isWrong ? 0.55 : 1 },
            ]}
          >
            <View style={[tw`w-10 h-10 rounded-xl items-center justify-center shrink-0`, { backgroundColor: badgeBg }]}>
              <Text bold size={14} style={{ color: badgeTextColor }}>{option.letter}</Text>
            </View>

            <Text medium size={15} style={tw`flex-1 leading-6`}>{option.text}</Text>

            {isCorrect && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
            {isWrong   && <Ionicons name="close-circle"     size={22} color={colors.error}   />}
          </Pressable>
        );
      })}
    </View>
  );
}
