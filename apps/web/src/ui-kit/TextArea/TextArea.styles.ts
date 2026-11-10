import styled from 'styled-components'
import { Control, Field } from '../TextField/TextField.styles'

export const Area = styled(Control).attrs({ as: 'textarea' })`
  min-height: 120px;
  resize: vertical;
`

export { Field }
