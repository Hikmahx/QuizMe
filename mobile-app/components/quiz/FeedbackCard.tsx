import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import { useColors, alpha } from '@/hooks/useTheme';
import { AIFeedback } from '@/types';

interface Props {
  index:        number;
  questionText: string;
  feedback:     AIFeedback;
  userAnswer?:  string;
  isTheory:     boolean;
}

const TRUNCATE_LENGTH = 120;

export default function FeedbackCard({ index, questionText, feedback, userAnswer, isTheory }: Props) {
  const colors    = useColors();
  const [expanded, setExpanded] = useState(false);

  const scoreColor  = feedback.score_pct >= 80 ? colors.success : feedback.score_pct >= 50 ? '#facc15' : colors.error;
  const borderColor = feedback.correct ? alpha(colors.success, 0.30) : alpha(colors.error, 0.25);
  const bgColor     = feedback.correct ? alpha(colors.success, 0.06) : alpha(colors.error, 0.05);

  const needsTruncation  = (userAnswer?.length ?? 0) > TRUNCATE_LENGTH;
  const displayedAnswer  = !expanded && needsTruncation
    ? userAnswer!.slice(0, TRUNCATE_LENGTH).trimEnd() + '…'
    : userAnswer;

  return (
    <View style={[tw`rounded-2xl p-4 gap-3`, { borderWidth: 1.5, borderColor, backgroundColor: bgColor }]}>
      <View style={tw`flex-row items-start gap-3`}>
        {isTheory ? (
          <View style={[tw`px-2 py-0.5 rounded-lg`, { backgroundColor: alpha(scoreColor, 0.18) }]}>
            <Text bold size={12} style={{ color: scoreColor }}>{feedback.score_pct}%</Text>
          </View>
        ) : (
          <View style={[tw`w-7 h-7 rounded-full items-center justify-center shrink-0`, { backgroundColor: feedback.correct ? colors.success : colors.error }]}>
            <Text bold size={13} style={{ color: '#fff' }}>{feedback.correct ? '✓' : '✗'}</Text>
          </View>
        )}

        <View style={tw`flex-1`}>
          <Text secondary size={11} style={tw`mb-1`}>Question {index + 1}</Text>
          <Text medium size={14} style={tw`leading-5`}>{questionText}</Text>
        </View>
      </View>

      {userAnswer && (
        <View style={[tw`rounded-xl p-3`, { backgroundColor: alpha(colors.appText, 0.05) }]}>
          <Text secondary size={11} style={tw`mb-1`}>Your answer</Text>
          <Text size={13} style={tw`italic leading-5`}>{displayedAnswer}</Text>
          {needsTruncation && (
            <Pressable onPress={() => setExpanded(prev => !prev)} style={tw`mt-1`}>
              <Text size={12} style={{ color: colors.primary }}>{expanded ? 'Show less' : 'Show more'}</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={[tw`rounded-xl p-3`, { backgroundColor: alpha(colors.appText, 0.05) }]}>
        <Text size={13} style={tw`leading-5`}>{feedback.explanation}</Text>
      </View>

      {!!feedback.tip && (
        <View style={tw`flex-row items-start gap-2`}>
          <Ionicons name="bulb-outline" size={14} color={scoreColor} style={tw`mt-0.5`} />
          <Text secondary size={12} style={tw`flex-1 leading-5`}>
            <Text medium size={12}>Pro Tip: </Text>{feedback.tip}
          </Text>
        </View>
      )}
    </View>
  );
}
