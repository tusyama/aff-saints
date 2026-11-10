import styled, { css } from 'styled-components'

const variants = {
  primary: css`
    background: ${({ theme }) => theme.color.accent};
    color: ${({ theme }) => theme.color.onAccent};
    border-color: transparent;
  `,
  secondary: css`
    background: ${({ theme }) => theme.color.surface};
    color: ${({ theme }) => theme.color.ink};
    border-color: ${({ theme }) => theme.color.line};
  `,
  danger: css`
    background: ${({ theme }) => theme.color.dangerSoft};
    color: ${({ theme }) => theme.color.danger};
    border-color: transparent;
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.color.ink};
    border-color: transparent;
  `,
}

export const Button = styled.button<{ $variant?: keyof typeof variants }>`
  appearance: none;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 14px;
  font-weight: 560;
  cursor: pointer;
  ${({ $variant = 'primary' }) => variants[$variant]}

  &:disabled {
    opacity: 0.55;
    cursor: progress;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`
