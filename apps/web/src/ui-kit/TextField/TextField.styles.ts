import styled from 'styled-components'

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  font-size: 14px;
  color: ${({ theme }) => theme.color.muted};
`

export const Control = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.color.line};
  background: ${({ theme }) => theme.color.surface};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 12px;
  color: ${({ theme }) => theme.color.ink};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 1px;
  }
`
