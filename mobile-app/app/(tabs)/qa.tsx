import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import tw from '@/lib/tw';
import Screen from '@/components/global/Screen';
import Header from '@/components/global/Header';
import { Text } from '@/components/global/Themed';
import { useColors, alpha } from '@/hooks/useTheme';
import { uploadFiles, BASE_URL } from '@/lib/api';
import { StoredFileMeta } from '@/types';

type Mode = 'default' | 'resume' | 'compare' | 'glossary';

const MODES: { value: Mode; label: string; icon: string; color: string }[] = [
  {
    value: 'default',
    label: 'Q&A',
    icon: 'chatbubble-ellipses-outline',
    color: '#26d782',
  },
  {
    value: 'resume',
    label: 'Resume',
    icon: 'document-text-outline',
    color: '#fb923c',
  },
  {
    value: 'compare',
    label: 'Compare',
    icon: 'git-compare-outline',
    color: '#60a5fa',
  },
  {
    value: 'glossary',
    label: 'Glossary',
    icon: 'book-outline',
    color: '#a729f5',
  },
];

const GREETINGS: Record<Mode, string> = {
  default: "Hello! I've reviewed your documents. What would you like to know?",
  resume:
    'Resume Mode active. Upload a resume and job description, then ask me anything.',
  compare:
    "Compare Mode active. Upload two documents and I'll highlight their similarities and differences.",
  glossary:
    'Glossary Mode active. Ask me to extract key terms or explain any concept from your documents.',
};

let messageCounter = 0;
const nextId = () => `msg-${++messageCounter}`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
  modeSwitch?: Mode;
}

async function streamChatResponse(
  collectionId: string,
  mode: Mode,
  files: StoredFileMeta[],
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (chunk: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/qa/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection_id: collectionId,
      mode,
      messages,
      file_names: files.map((f) => f.name),
    }),
    signal,
  });

  if (!response.ok) throw new Error(`Chat error ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export default function QA() {
  const colors = useColors();
  const { files, collectionId: uploadedCollectionId } = useSelector(
    (state: RootState) => state.upload,
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<Mode>('default');
  const [inputText, setInputText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [initState, setInitState] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');

  const scrollRef = useRef<ScrollView>(null);
  const collectionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initDone = useRef(false);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    initialiseChat();
  }, []);

  async function initialiseChat() {
    if (!files.length) {
      setMessages([
        {
          id: nextId(),
          role: 'assistant',
          content:
            'No documents uploaded yet. Head to the Upload tab to add your files, then come back here to chat.',
        },
      ]);
      return;
    }

    setInitState('loading');
    try {
      let collectionId = uploadedCollectionId;
      if (!collectionId) {
        const result = await uploadFiles(files);
        collectionId = result.collection_id;
      }
      collectionIdRef.current = collectionId;
      setInitState('ready');
      await streamAssistantReply(
        [
          {
            role: 'user',
            content: `Greet the user concisely: "${GREETINGS[mode]}"`,
          },
        ],
        mode,
        collectionId,
      );
    } catch {
      setInitState('error');
      setMessages([
        {
          id: nextId(),
          role: 'assistant',
          content:
            'Unable to connect to the AI. Please check your connection and try again.',
        },
      ]);
    }
  }

  const streamAssistantReply = useCallback(
    async (
      history: { role: 'user' | 'assistant'; content: string }[],
      currentMode: Mode,
      collectionId: string,
    ) => {
      const messageId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: messageId, role: 'assistant', content: '', loading: true },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      let accumulated = '';

      try {
        await streamChatResponse(
          collectionId,
          currentMode,
          files,
          history,
          (chunk) => {
            accumulated += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, content: accumulated, loading: false }
                  : msg,
              ),
            );
          },
          controller.signal,
        );
      } catch (err: any) {
        const wasAborted = err?.name === 'AbortError';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: wasAborted
                    ? ''
                    : accumulated || 'Something went wrong.',
                  loading: false,
                }
              : msg,
          ),
        );
      } finally {
        setStreaming(false);
      }
    },
    [files],
  );

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || streaming || !collectionIdRef.current) return;

    setInputText('');
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', content: text },
    ]);

    const history = messages
      .filter((msg) => !msg.loading && !msg.modeSwitch)
      .map((msg) => ({ role: msg.role, content: msg.content }));
    history.push({ role: 'user', content: text });

    await streamAssistantReply(history, mode, collectionIdRef.current);
  };

  const switchMode = async (newMode: Mode) => {
    if (streaming || newMode === mode) return;
    setMode(newMode);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', content: '', modeSwitch: newMode },
    ]);

    if (!collectionIdRef.current) return;

    const history = messages
      .filter((msg) => !msg.loading && !msg.modeSwitch)
      .map((msg) => ({ role: msg.role, content: msg.content }));
    history.push({
      role: 'user',
      content: `Switched to ${newMode} mode. Acknowledge briefly.`,
    });

    await streamAssistantReply(history, newMode, collectionIdRef.current);
  };

  const activeModeColor =
    MODES.find((m) => m.value === mode)?.color ?? colors.primary;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Header />

        {/* Mode bar */}
        <View
          style={[tw`px-5 pb-3 border-b`, { borderBottomColor: colors.border }]}
        >
          <View style={tw`flex-row items-center justify-between mb-2.5`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View
                style={[
                  tw`w-7 h-7 rounded-full items-center justify-center`,
                  { backgroundColor: alpha(activeModeColor, 0.15) },
                ]}
              >
                <Ionicons name='sparkles' size={13} color={activeModeColor} />
              </View>
              <Text medium size={15}>
                QuizMe AI
              </Text>
              {streaming && (
                <View style={tw`flex-row gap-1`}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={[
                        tw`w-1 h-1 rounded-full`,
                        { backgroundColor: colors.primary, opacity: 0.6 },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            <View
              style={[
                tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full`,
                {
                  backgroundColor: alpha(activeModeColor, 0.12),
                  borderWidth: 1,
                  borderColor: alpha(activeModeColor, 0.3),
                },
              ]}
            >
              <View
                style={[
                  tw`w-1.5 h-1.5 rounded-full`,
                  { backgroundColor: activeModeColor },
                ]}
              />
              <Text medium size={12} style={{ color: activeModeColor }}>
                {MODES.find((m) => m.value === mode)?.label}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2`}
          >
            {MODES.filter((m) => m.value !== mode).map((m) => (
              <Pressable
                key={m.value}
                onPress={() => switchMode(m.value)}
                disabled={streaming}
                style={({ pressed }) => [
                  tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full`,
                  {
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: pressed
                      ? alpha(colors.appText, 0.06)
                      : 'transparent',
                    opacity: streaming ? 0.4 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={m.icon as any}
                  size={12}
                  color={colors.appTextSecondary}
                />
                <Text secondary size={12}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={tw`flex-1`}
          contentContainerStyle={tw`px-5 py-4`}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          {initState === 'loading' && messages.length === 0 ? (
            <View style={tw`items-center py-12`}>
              <ActivityIndicator color={colors.primary} />
              <Text secondary size={13} style={tw`mt-3`}>
                Connecting to AI…
              </Text>
            </View>
          ) : (
            messages.map((msg) => {
              // Mode switch pill
              if (msg.modeSwitch) {
                const modeData = MODES.find((m) => m.value === msg.modeSwitch);
                return (
                  <View key={msg.id} style={tw`items-end mb-3`}>
                    <View
                      style={[
                        tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full`,
                        {
                          backgroundColor: alpha(
                            modeData?.color ?? '#fff',
                            0.12,
                          ),
                          borderWidth: 1,
                          borderColor: alpha(modeData?.color ?? '#fff', 0.3),
                        },
                      ]}
                    >
                      <Ionicons
                        name={modeData?.icon as any}
                        size={13}
                        color={modeData?.color}
                      />
                      <Text medium size={12} style={{ color: modeData?.color }}>
                        Switched to {modeData?.label}
                      </Text>
                    </View>
                  </View>
                );
              }

              // User bubble
              if (msg.role === 'user') {
                return (
                  <View key={msg.id} style={tw`items-end mb-3`}>
                    <View
                      style={[
                        tw`rounded-2xl px-4 py-2.5`,
                        {
                          backgroundColor: alpha(colors.primary, 0.15),
                          maxWidth: '80%',
                        },
                      ]}
                    >
                      <Text size={14} style={tw`leading-5`}>
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                );
              }

              // Assistant bubble
              return (
                <View
                  key={msg.id}
                  style={tw`flex-row items-start gap-2.5 mb-3.5`}
                >
                  <View
                    style={[
                      tw`w-7 h-7 rounded-full items-center justify-center shrink-0 mt-0.5`,
                      { backgroundColor: alpha(colors.primary, 0.15) },
                    ]}
                  >
                    <Ionicons
                      name='sparkles'
                      size={12}
                      color={colors.primary}
                    />
                  </View>
                  {msg.loading ? (
                    <View
                      style={[
                        tw`rounded-2xl px-4 py-3`,
                        {
                          backgroundColor: colors.appCard,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={tw`flex-row gap-1.5`}>
                        {[0, 1, 2].map((i) => (
                          <View
                            key={i}
                            style={[
                              tw`w-2 h-2 rounded-full`,
                              {
                                backgroundColor: colors.appTextSecondary,
                                opacity: 0.35 + i * 0.2,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  ) : (
                    <Text size={14} style={tw`flex-1 leading-6`}>
                      {msg.content}
                    </Text>
                  )}
                </View>
              );
            })
          )}
          <View style={tw`h-2`} />
        </ScrollView>

        {/* Input bar */}
        <View
          style={[
            tw`flex-row items-end gap-2.5 px-4 py-3 border-t`,
            { borderTopColor: colors.border, backgroundColor: colors.appBg },
          ]}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            placeholder='Ask anything about your documents…'
            placeholderTextColor={colors.appTextSecondary}
            style={[
              tw`flex-1 rounded-2xl px-4 py-3`,
              {
                backgroundColor: colors.appCard,
                fontFamily: 'Rubik_400Regular',
                fontSize: 14,
                color: colors.appText,
                maxHeight: 120,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={sendMessage}
            disabled={
              !inputText.trim() || streaming || !collectionIdRef.current
            }
            style={[
              tw`w-11 h-11 rounded-full items-center justify-center`,
              {
                backgroundColor:
                  !inputText.trim() || streaming || !collectionIdRef.current
                    ? alpha(colors.appTextSecondary, 0.18)
                    : colors.primary,
              },
            ]}
          >
            <Ionicons
              name='send'
              size={18}
              color={
                !inputText.trim() || streaming || !collectionIdRef.current
                  ? colors.appTextSecondary
                  : '#fff'
              }
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
