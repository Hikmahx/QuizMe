import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  setFeedbacks,
  setOverallPct,
  resetQuiz,
} from '@/redux/slices/quizSlice';
import tw from '@/lib/tw';
import Screen from '@/components/global/Screen';
import Header from '@/components/global/Header';
import { Text } from '@/components/global/Themed';
import StepBadge from '@/components/global/StepBadge';
import FeedbackCard from '@/components/quiz/FeedbackCard';
import Btn from '@/components/global/Btn';
import { useColors, alpha } from '@/hooks/useTheme';
import { evaluateQuizApi, AnswerPayload } from '@/lib/api';

export default function QuizFeedback() {
  const router = useRouter();
  const dispatch = useDispatch();
  const colors = useColors();
  const {
    questions,
    answers,
    questionType,
    feedbacks,
    overallPct,
    collectionId,
  } = useSelector((state: RootState) => state.quiz);

  const [evaluating, setEvaluating] = useState(false);

  const isMCQ = questionType === 'mcq';
  const isTheory = !isMCQ;

  useEffect(() => {
    if (questions.length === 0) {
      router.replace('/(tabs)/quiz/options');
      return;
    }
    if (feedbacks.length > 0) return;

    const payloads: AnswerPayload[] = questions.map((question, index) => {
      const answer = answers[index];
      if (isMCQ) {
        const userAnswerText =
          typeof answer?.answer === 'number'
            ? (question.options?.[answer.answer]?.text ?? '')
            : '';
        const correctAnswerText =
          question.correctIndex !== undefined
            ? (question.options?.[question.correctIndex]?.text ?? '')
            : '';
        return {
          question: question.text,
          user_answer: userAnswerText,
          correct_answer: correctAnswerText,
          question_type: 'mcq',
        };
      }
      return {
        question: question.text,
        user_answer: typeof answer?.answer === 'string' ? answer.answer : '',
        correct_answer: '',
        question_type: 'theory',
      };
    });

    setEvaluating(true);
    evaluateQuizApi(payloads, collectionId).then((result) => {
      dispatch(setFeedbacks(result.feedbacks));
      dispatch(setOverallPct(result.overall_pct));
      setEvaluating(false);
    });
  }, []);

  const correctCount = feedbacks.filter((f) => f?.correct).length;

  return (
    <Screen>
      <Header />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <StepBadge label='AI Feedback' />
        <Text size={34} style={{ lineHeight: 44 }}>
          Here's what{'\n'}
          <Text
            bold
            size={34}
            style={{ lineHeight: 44, color: colors.primary }}
          >
            the AI thinks.
          </Text>
        </Text>
        <Text secondary size={13} style={tw`italic mt-2 mb-6 leading-5`}>
          {isTheory
            ? 'Each answer is graded as a percentage. 50%+ = correct.'
            : 'Review each explanation to understand where you went wrong.'}
        </Text>

        {/* Summary bar */}
        <View
          style={[
            tw`flex-row items-center gap-3.5 rounded-2xl p-4 mb-6`,
            {
              backgroundColor: colors.appCard,
              borderWidth: 1.5,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              tw`w-11 h-11 rounded-xl items-center justify-center`,
              { backgroundColor: alpha(colors.primary, 0.15) },
            ]}
          >
            <Ionicons
              name='bar-chart-outline'
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={tw`flex-1`}>
            {evaluating ? (
              <>
                <Text medium size={14}>
                  Grading…
                </Text>
                <Text secondary size={12} style={tw`mt-0.5`}>
                  AI is evaluating your answers
                </Text>
              </>
            ) : feedbacks.length > 0 ? (
              <>
                <Text bold size={16}>
                  {isMCQ
                    ? `${correctCount} / ${questions.length} correct`
                    : `${Math.round(overallPct ?? 0)}% overall score`}
                </Text>
                <Text secondary size={12} style={tw`mt-0.5`}>
                  {isMCQ
                    ? `${Math.round((correctCount / questions.length) * 100)}% accuracy`
                    : `${correctCount} of ${questions.length} answers scored 50%+`}
                </Text>
              </>
            ) : null}
          </View>
          {evaluating && <ActivityIndicator color={colors.primary} />}
        </View>

        {/* Per-question feedback */}
        {evaluating && feedbacks.length === 0 ? (
          <View style={tw`items-center py-12`}>
            <ActivityIndicator color={colors.primary} size='large' />
            <Text secondary size={13} style={tw`mt-4`}>
              AI is grading your answers…
            </Text>
          </View>
        ) : (
          <View style={tw`gap-4 mb-7`}>
            {questions.map((question, index) => {
              const feedback = feedbacks[index];
              const answer = answers[index];
              if (!feedback) return null;

              const userAnswer = isMCQ
                ? typeof answer?.answer === 'number'
                  ? question.options?.[answer.answer]?.text
                  : undefined
                : typeof answer?.answer === 'string'
                  ? answer.answer
                  : undefined;

              return (
                <FeedbackCard
                  key={question.id}
                  index={index}
                  questionText={question.text}
                  feedback={feedback}
                  userAnswer={userAnswer}
                  isTheory={isTheory}
                />
              );
            })}
          </View>
        )}

        <View style={tw`gap-3`}>
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
