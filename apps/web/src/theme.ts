import { createGlobalStyle } from 'styled-components'

export const theme = {
  color: {
    bg: '#f3f1ec',
    surface: '#fffdf9',
    ink: '#1c1917',
    muted: '#78716c',
    line: '#e5e0d6',
    accent: '#0f6e6b',
    accentSoft: '#e7f3f2',
    onAccent: '#f4fffe',
    danger: '#9f1239',
    dangerSoft: '#fdecef',
  },
  status: {
    NEW: '#44403c',
    IN_PROGRESS: '#0f6e6b',
    IN_REVIEW: '#b45309',
    REVISIONS: '#9f1239',
    DONE: '#3f6212',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
  },
  radius: {
    sm: '8px',
    md: '12px',
  },
  shadow: '0 1px 2px rgba(28, 25, 23, 0.04), 0 10px 28px rgba(28, 25, 23, 0.05)',
  font: '"IBM Plex Sans", "Segoe UI", sans-serif',
}

type AppTheme = typeof theme

declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { min-height: 100%; }
  body {
    margin: 0;
    background: ${({ theme }) => theme.color.bg};
    color: ${({ theme }) => theme.color.ink};
    font-family: ${({ theme }) => theme.font};
    font-size: 16px;
    line-height: 1.45;
  }
  a { color: inherit; }
  button, input, textarea, select { font: inherit; color: inherit; }
  h1, h2, h3, p { margin: 0; }
`
