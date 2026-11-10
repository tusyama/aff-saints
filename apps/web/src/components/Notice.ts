import styled from 'styled-components'

export const Notice = styled.p<{ $tone?: 'danger' | 'muted' }>`
  margin: 0;
  color: ${({ theme, $tone = 'danger' }) => ($tone === 'muted' ? theme.color.muted : theme.color.danger)};
  font-size: 14px;
`
