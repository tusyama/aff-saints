import styled from 'styled-components'
import { Stack } from '@/ui-kit'

export const Screen = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.space.lg};
`

export const Card = styled(Stack).attrs({ $gap: 'lg' })`
  width: min(440px, 100%);
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadow};
`

export const Title = styled.h1`
  font-size: 32px;
  letter-spacing: -0.04em;
`

export const Account = styled.button`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  text-align: left;
  cursor: pointer;

  span:last-child {
    color: ${({ theme }) => theme.color.muted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`
