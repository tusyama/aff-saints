import type { SelectHTMLAttributes } from 'react'
import { Field, SelectControl } from './Select.styles'

type Option = { value: string; label: string }

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: Option[]
}

export function Select({ label, id, options, ...props }: SelectProps) {
  const fieldId = id ?? props.name
  return (
    <Field htmlFor={fieldId}>
      {label}
      <SelectControl id={fieldId} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectControl>
    </Field>
  )
}
