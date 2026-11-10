import type { TextareaHTMLAttributes } from 'react'
import { Area, Field } from './TextArea.styles'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
}

export function TextArea({ label, id, ...props }: TextAreaProps) {
  const fieldId = id ?? props.name
  return (
    <Field htmlFor={fieldId}>
      {label}
      <Area id={fieldId} {...props} />
    </Field>
  )
}
