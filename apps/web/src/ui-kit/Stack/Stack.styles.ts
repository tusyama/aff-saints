import styled from 'styled-components'

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const Stack = styled.div<{
  $direction?: 'row' | 'column'
  $gap?: Gap
  $align?: string
  $justify?: string
  $wrap?: boolean
}>`
  display: flex;
  flex-direction: ${({ $direction = 'column' }) => $direction};
  gap: ${({ theme, $gap = 'md' }) => theme.space[$gap]};
  align-items: ${({ $align = 'stretch' }) => $align};
  justify-content: ${({ $justify = 'flex-start' }) => $justify};
  flex-wrap: ${({ $wrap }) => ($wrap ? 'wrap' : 'nowrap')};
  min-width: 0;
`
