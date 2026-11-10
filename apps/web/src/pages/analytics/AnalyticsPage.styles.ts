import styled from 'styled-components'

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
  max-width: 1080px;
`

export const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`

export const Stat = styled.div`
  padding: 14px;
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.md};
`

export const StatValue = styled.p`
  font-size: 24px;
  letter-spacing: -0.03em;
  line-height: 1.15;
  white-space: nowrap;
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.space.lg};
`

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.md};
`

export const BarRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 8px;
  align-items: center;
  font-size: 14px;
`

export const Track = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.color.bg};
  border-radius: 999px;
  overflow: hidden;
`

export const Fill = styled.div<{ $width: number }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ theme }) => theme.color.accent};
`

export const Person = styled.p`
  margin: 0;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
`
