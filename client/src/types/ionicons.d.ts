import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': {
        name?: string;
        size?: string;
        color?: string;
        style?: React.CSSProperties;
        className?: string;
      };
    }
  }
}
