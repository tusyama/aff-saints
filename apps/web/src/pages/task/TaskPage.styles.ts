import styled from 'styled-components'

export const Page = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
  max-width: 860px;
`

export const Title = styled.h1`
  font-size: 28px;
  letter-spacing: -0.03em;
`

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`

export const Text = styled.p`
  white-space: pre-wrap;
`

export const LinkList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;

  a {
    color: ${({ theme }) => theme.color.accent};
    overflow-wrap: anywhere;
  }
`

export const Timeline = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`

export const Event = styled.li`
  padding-left: 12px;
  border-left: 2px solid ${({ theme }) => theme.color.line};
`

export const Muted = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.muted};
  font-size: 14px;
`

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
`
