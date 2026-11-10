import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px ${({ theme }) => theme.space.md};
  min-height: 64px;
  padding: 8px ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.color.surface};
  border-bottom: 1px solid ${({ theme }) => theme.color.line};
`

export const Brand = styled(NavLink)`
  font-weight: 600;
  letter-spacing: -0.03em;
  text-decoration: none;
`

export const Nav = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
`

export const Item = styled(NavLink)`
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  text-decoration: none;
  color: ${({ theme }) => theme.color.muted};

  &[aria-current='page'] {
    color: ${({ theme }) => theme.color.ink};
    background: ${({ theme }) => theme.color.accentSoft};
  }
`

export const Who = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  color: ${({ theme }) => theme.color.muted};
  font-size: 14px;
`

export const Main = styled.main`
  padding: ${({ theme }) => theme.space.lg};
`
