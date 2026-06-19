import { View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { resetQuiz } from '@/redux/slices/quizSlice';
import tw from '@/lib/tw';
import Screen from '@/components/global/Screen';
import Header from '@/components/global/Header';
import { Text } from '@/components/global/Themed';
import StepBadge from '@/components/global/StepBadge';
import Card from '@/components/global/Card';
import Btn from '@/components/global/Btn';
import { useColors, alpha } from '@/hooks/useTheme';

export default function QuizScore() {
  const router = useRouter();
  const dispatch = useDispatch();
  const colors = useColors();
  const { answers, questions, questionType } = useSelector(
    (state: RootState) => state.quiz,
  );

  const isMCQ = questionType === 'mcq';
  const total = questions.length;
  const correctCount = isMCQ
    ? answers.filter((a) => a.correct === true).length
    : 0;
  const percentage =
    isMCQ && total > 0 ? Math.round((correctCount / total) * 100) : null;

  const scoreColor =
    percentage === null
      ? colors.primary
      : percentage >= 80
        ? colors.success
        : percentage >= 50
          ? '#facc15'
          : colors.error;

  const headline =
    percentage === null
      ? 'Quiz complete!'
      : percentage >= 80
        ? 'Excellent work!'
        : percentage >= 50
          ? 'Good effort!'
          : 'Keep practising!';

  const subtitle =
    percentage === null
      ? 'Head to the feedback page to see your AI-graded score.'
      : percentage >= 80
        ? 'You have a strong grasp of this material.'
        : percentage >= 50
          ? 'Solid foundation — review the feedback to improve.'
          : "Review the feedback carefully — you've got this.";

  return (
    <Screen>
      <Header />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <StepBadge label='Quiz completed' />
        <Text size={34} style={{ lineHeight: 44 }}>
          You scored…{'\n'}
          <Text bold size={34} style={{ color: scoreColor }}>
            {headline}
          </Text>
        </Text>
        <Text secondary size={13} style={tw`italic mt-2 mb-7 leading-5`}>
          {subtitle}
        </Text>

        <Card style={tw`items-center mb-6`}>
          {isMCQ ? (
            <>
              <Text
                bold
                size={88}
                style={{ color: scoreColor, lineHeight: 100 }}
              >
                {correctCount}
              </Text>
              <Text secondary size={15} style={tw`mt-1`}>
                out of {total}
              </Text>
              {percentage !== null && (
                <View
                  style={[
                    tw`mt-3 px-4 py-1.5 rounded-full`,
                    { backgroundColor: alpha(scoreColor, 0.15) },
                  ]}
                >
                  <Text bold size={18} style={{ color: scoreColor }}>
                    {percentage}%
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View
                style={[
                  tw`w-16 h-16 rounded-2xl items-center justify-center mb-3`,
                  { backgroundColor: alpha(colors.primary, 0.15) },
                ]}
              >
                <Ionicons
                  name='sparkles-outline'
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text medium size={15} style={tw`text-center`}>
                AI grading in progress
              </Text>
              <Text
                secondary
                size={13}
                style={tw`text-center mt-1.5 leading-5`}
              >
                Your {total} answers will be graded on the feedback page.
              </Text>
            </>
          )}
        </Card>

        <View style={tw`gap-3`}>
          <Btn
            variant='secondary'
            label={isMCQ ? 'View Feedback' : 'View AI Feedback & Score'}
            onPress={() => router.push('/(tabs)/quiz/feedback')}
          />
          <Btn
            label='Play Again'
            onPress={() => {
              dispatch(resetQuiz());
              router.push('/(tabs)/quiz/options');
            }}
          />
          <Pressable
            onPress={() => router.push('/(tabs)/home')}
            style={tw`items-center py-3.5`}
          >
            <Text secondary size={13}>
              ← Back to home
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
