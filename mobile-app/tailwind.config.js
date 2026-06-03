// Mirrors the web client's theme.css @theme tokens exactly.
// Dark variants are applied at runtime via useColorScheme().
// Usage: tw`bg-app-bg text-app-text border-app-card` etc.
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:             '#a729f5',
        success:             '#26d782',
        error:               '#ee5454',

        // Light mode tokens
        'app-bg':            '#f4f6fa',
        'app-card':          '#ffffff',
        'app-text':          '#313e51',
        'app-text-secondary':'#626c7f',
        'app-shadow':        '#8fa0c1',

        // Dark mode tokens (same names — switched via useColorScheme)
        'dark-bg':           '#313e51',
        'dark-card':         '#3b4d66',
        'dark-text':         '#ffffff',
        'dark-text-secondary':'#abc1e1',
        'dark-shadow':       '#1a2535',
      },
      fontFamily: {
        rubik:        ['Rubik_400Regular'],
        'rubik-md':   ['Rubik_500Medium'],
        'rubik-bold': ['Rubik_700Bold'],
      },
      borderRadius: {
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
