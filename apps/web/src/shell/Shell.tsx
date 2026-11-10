import { Outlet } from 'react-router-dom'
import { ROLE_LABEL } from '@/constants/labels'
import { Button } from '@/ui-kit'
import { useAuth } from '@/auth/AuthProvider'
import { Brand, Header, Item, Main, Nav, Who } from './Shell.styles'

export function Shell() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <>
      <Header>
        <Brand to="/board">Креатив</Brand>
        <Nav>
          <Item to="/board">Доска</Item>
          {user.role === 'BUYER' ? <Item to="/tasks/new">Новая задача</Item> : null}
          {user.role === 'MANAGER' ? <Item to="/analytics">Аналитика</Item> : null}
        </Nav>
        <Who>
          <span>{user.name}</span>
          <span>{ROLE_LABEL[user.role]}</span>
          <Button type="button" $variant="ghost" onClick={() => void logout()}>
            Выйти
          </Button>
        </Who>
      </Header>
      <Main>
        <Outlet />
      </Main>
    </>
  )
}
