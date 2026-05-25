// Matches the web client's theme.css tokens exactly
// Dark: bg=#313e51, card=#3b4d66, text=#fff, secondary=#abc1e1
// Light: bg=#f4f6fa, card=#fff, text=#313e51, secondary=#626c7f

const Colors = {
  light: {
    text:          '#313e51',
    textSecondary: '#626c7f',
    background:    '#f4f6fa',
    card:          '#ffffff',
    primary:       '#a729f5',
    success:       '#26d782',
    error:         '#ee5454',
    border:        'rgba(49,62,81,0.12)',
    shadow:        '#8fa0c1',
    tint:          '#a729f5',
  },
  dark: {
    text:          '#ffffff',
    textSecondary: '#abc1e1',
    background:    '#313e51',
    card:          '#3b4d66',
    primary:       '#a729f5',
    success:       '#26d782',
    error:         '#ee5454',
    border:        'rgba(255,255,255,0.1)',
    shadow:        '#1a2535',
    tint:          '#a729f5',
  },
};

export default Colors;
export type ColorScheme = typeof Colors.light;
