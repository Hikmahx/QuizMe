# QuizMe Mobile

React Native · Expo SDK 51 · Expo Router · twrnc · Redux Toolkit

Pixel-matched to the QuizMe web client (dark/light theme, Rubik font, purple `#a729f5` brand).

## Stack

| | |
|---|---|
| Navigation | Expo Router (file-based) |
| Styling | `twrnc` + inline style objects via `useColors()` |
| Theme | `useColorScheme()` → `constants/Colors.ts` → `hooks/useThemeColor.ts` |
| State | Redux Toolkit |
| Fonts | Rubik 400 / 500 / 700 via `@expo-google-fonts/rubik` |

## Structure

```
app/
  _layout.tsx          # Provider + fonts
  index.tsx            # Splash → home
  (tabs)/
    _layout.tsx        # Bottom tab bar (5 tabs)
    home.tsx           # Feature picker
    upload.tsx         # File upload + preview modal
    summary.tsx        # Summary wizard (length → style → result)
    qa.tsx             # Streaming RAG chat
    quiz/
      options.tsx      # 3-4 step wizard
      ready.tsx        # Pre-quiz confirmation
      play.tsx         # Active quiz (MCQ + theory)
      score.tsx        # Score card
      feedback.tsx     # AI-graded per-question feedback

components/global/
  Themed.tsx           # <Text> + <View> with automatic dark/light colour
  Screen.tsx           # SafeAreaView with themed bg
  Header.tsx           # QuizMe logo + dark/light toggle
  ProgressBar.tsx      # Animated reanimated bar
  StepBadge.tsx        # Purple pill badge
  InfoList.tsx         # Purple dot bullet list
  OptionCard.tsx       # Selection card with radio indicator
  Btn.tsx              # primary / secondary / ghost button
  Card.tsx             # Themed shadow card

hooks/
  useColorScheme.ts    # Re-exports RN useColorScheme
  useThemeColor.ts     # useColors() + useIsDark()

constants/Colors.ts    # Light + dark token map
```

## Getting started

```bash
npm install
cp .env.example .env.local   # set EXPO_PUBLIC_API_URL
npx expo start
```
