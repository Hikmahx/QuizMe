import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  setQuestions,
  updateAnswer,
  setCurrentIndex,
  setLoadState,
  setLoadError,
  setQuizCollectionId,
} from '@/redux/slices/quizSlice';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import MCQOptions from '@/components/quiz/MCQOptions';
import Btn from '@/components/global/Btn';
import { useColors, alpha } from '@/hooks/useTheme';
import { uploadFiles, generateQuizApi } from '@/lib/api';

export default function QuizPlay() {
  const router = useRouter();
  const dispatch = useDispatch();
  const colors = useColors();

  const {
    difficulty,
    questionCount,
    questionType,
    questions,
    answers,
    currentIndex,
    loadState,
    loadError,
  } = useSelector((state: RootState) => state.quiz);
  const { files, collectionId: uploadedCollectionId } = useSelector(
    (state: RootState) => state.upload,
  );

  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [showError, setShowError] = useState(false);

  const isMCQ = questionType === 'mcq';
  const total = questions.length;
  const question = questions[currentIndex];
  const answer = answers[currentIndex];

  const progressValue = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%` as any,
  }));

  useEffect(() => {
    if (total > 0) {
      progressValue.value = withTiming(((currentIndex + 1) / total) * 100, {
        duration: 400,
      });
    }
  }, [currentIndex, total]);

  useEffect(() => {
    if (loadState !== 'idle') return;

    (async () => {
      try {
        let collectionId = uploadedCollectionId;

        if (!collectionId) {
          if (!files?.length)
            throw new Error('No documents found. Please upload files first.');
          dispatch(setLoadState('uploading'));
          const uploadResult = await uploadFiles(files);
          collectionId = uploadResult.collection_id;
          dispatch(setQuizCollectionId(collectionId));
        }

        dispatch(setLoadState('generating'));
        const generatedQuestions = await generateQuizApi({
          collectionId: collectionId!,
          difficulty: difficulty!,
          count: questionCount!,
          questionType: questionType!,
        });
        dispatch(setQuestions(generatedQuestions));
        dispatch(setLoadState('ready'));
      } catch (err: any) {
        dispatch(setLoadError(err.message ?? 'Failed to generate questions.'));
        dispatch(setLoadState('error'));
      }
    })();
  }, []);

  useEffect(() => {
    setWrittenAnswer('');
    setShowError(false);
  }, [currentIndex]);

  const canSubmit = isMCQ
    ? answer?.answer !== null && answer?.answer !== undefined
    : writtenAnswer.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      setShowError(true);
      return;
    }
    setShowError(false);

    if (isMCQ) {
      dispatch(
        updateAnswer({
          index: currentIndex,
          patch: {
            submitted: true,
            correct: answer.answer === question.correctIndex,
          },
        }),
      );
    } else {
      dispatch(
        updateAnswer({
          index: currentIndex,
          patch: {
            answer: writtenAnswer.trim(),
            submitted: true,
            correct: null,
          },
        }),
      );
    }
  };

  const handleNext = () => {
    setShowError(false);
    if (currentIndex < total - 1) dispatch(setCurrentIndex(currentIndex + 1));
    else router.push('/(tabs)/quiz/score');
  };

  // Loading state
  if (
    loadState === 'idle' ||
    loadState === 'uploading' ||
    loadState === 'generating'
  ) {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center px-8`,
          { backgroundColor: colors.appBg },
        ]}
      >
        <View
          style={[
            tw`w-20 h-20 rounded-3xl items-center justify-center mb-6`,
            { backgroundColor: alpha(colors.primary, 0.15) },
          ]}
        >
          <ActivityIndicator color={colors.primary} size='large' />
        </View>
        <Text bold size={20} style={tw`text-center mb-2`}>
          {loadState === 'uploading'
            ? 'Uploading documents…'
            : 'Generating questions…'}
        </Text>
        <Text secondary size={13} style={tw`text-center leading-5`}>
          {loadState === 'generating'
            ? 'AI is reading your documents.\nThis may take 15–90 seconds.'
            : 'Indexing your files…'}
        </Text>
      </View>
    );
  }

  // Error state
  if (loadState === 'error') {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center px-8`,
          { backgroundColor: colors.appBg },
        ]}
      >
        <Ionicons name='alert-circle-outline' size={56} color={colors.error} />
        <Text bold size={20} style={tw`mt-4 text-center mb-2`}>
          Something went wrong
        </Text>
        <Text secondary size={13} style={tw`text-center mb-8`}>
          {loadError}
        </Text>
        <Btn
          label='Go Back'
          onPress={() => router.push('/(tabs)/quiz/options')}
        />
      </View>
    );
  }

  if (!question) return null;

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.appBg }]}>
      {/* Purple header band */}
      <View style={[tw`px-6 pt-14 pb-7`, { backgroundColor: colors.primary }]}>
        <View style={tw`flex-row items-center justify-between mb-5`}>
          <Pressable onPress={() => router.push('/(tabs)/quiz/options')}>
            <Ionicons name='close' size={26} color='rgba(255,255,255,0.85)' />
          </Pressable>
          <View
            style={tw`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20`}
          >
            <Ionicons name='help-circle-outline' size={14} color='#fff' />
            <Text medium size={13} style={{ color: '#fff' }}>
              {currentIndex + 1} / {total}
            </Text>
          </View>
          <View style={tw`w-7`} />
        </View>

        <View
          style={tw`w-13 h-13 rounded-2xl bg-white/20 items-center justify-center mb-3.5 self-center`}
        >
          <Text bold size={22} style={{ color: '#fff' }}>
            {currentIndex + 1}
          </Text>
        </View>

        <Text
          medium
          size={17}
          style={[tw`text-center leading-7`, { color: '#fff' }]}
        >
          {question.text}
        </Text>

        <View
          style={[
            tw`mt-5 h-0.5 rounded-full overflow-hidden`,
            { backgroundColor: 'rgba(255,255,255,0.25)' },
          ]}
        >
          <Animated.View
            style={[tw`h-full rounded-full bg-white`, progressStyle]}
          />
        </View>
      </View>

      {/* Answer body */}
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-6 pt-6 pb-8`}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          {isMCQ && question.options && (
            <MCQOptions
              options={question.options}
              selectedIndex={
                typeof answer?.answer === 'number' ? answer.answer : null
              }
              correctIndex={question.correctIndex}
              submitted={answer?.submitted ?? false}
              onSelect={(index) => {
                if (!answer?.submitted) {
                  dispatch(
                    updateAnswer({
                      index: currentIndex,
                      patch: { answer: index },
                    }),
                  );
                }
              }}
            />
          )}

          {!isMCQ && (
            <TextInput
              multiline
              value={writtenAnswer}
              onChangeText={setWrittenAnswer}
              editable={!answer?.submitted}
              placeholder='Type your answer here…'
              placeholderTextColor={colors.appTextSecondary}
              style={[
                tw`rounded-2xl p-4`,
                {
                  backgroundColor: colors.appCard,
                  borderWidth: 2,
                  borderColor: answer?.submitted
                    ? colors.border
                    : colors.primary,
                  fontFamily: 'Rubik_400Regular',
                  fontSize: 15,
                  color: colors.appText,
                  minHeight: 140,
                  textAlignVertical: 'top',
                  lineHeight: 24,
                },
              ]}
            />
          )}

          {showError && (
            <Text size={13} style={[tw`mt-2.5`, { color: colors.error }]}>
              {isMCQ
                ? 'Please select an option before continuing.'
                : 'Please write your answer before continuing.'}
            </Text>
          )}

          <View style={tw`mt-5`}>
            {answer?.submitted ? (
              <Btn
                label={
                  currentIndex < total - 1 ? 'Next Question →' : 'Finish Quiz →'
                }
                onPress={handleNext}
              />
            ) : (
              <Btn
                label='Submit Answer'
                onPress={handleSubmit}
                disabled={!canSubmit}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
