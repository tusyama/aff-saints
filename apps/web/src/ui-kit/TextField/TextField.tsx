import type { InputHTMLAttributes } from 'react'
import { Control, Field } from './TextField.styles'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function TextField({ label, id, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name
  return (
    <Field htmlFor={fieldId}>
      {label}
      <Control id={fieldId} {...props} />
    </Field>
  )
}
