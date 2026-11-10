import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const Board = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.space.md};
`

export const Column = styled.section`
  flex: 1 0 240px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`

export const ColumnTitle = styled.h2`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
`

export const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  text-decoration: none;
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadow};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`

export const Offer = styled.strong`
  font-size: 15px;
  letter-spacing: -0.02em;
`

export const Meta = styled.p`
  color: ${({ theme }) => theme.color.muted};
  font-size: 13px;
`

export const Overdue = styled.span`
  color: ${({ theme }) => theme.color.danger};
  font-size: 13px;
  font-weight: 600;
`

export const Hint = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.color.muted};
  font-size: 14px;
`
