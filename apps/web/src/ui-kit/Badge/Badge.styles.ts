import styled from 'styled-components'

export const Badge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, ${({ $color }) => $color} 12%, white);
  color: ${({ $color }) => $color};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }
`
