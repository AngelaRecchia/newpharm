'use client'

import FilterChips from '@/components/molecules/FilterChips'
import {
  PROJECT_DIVISIONS,
  type ProjectDivision,
} from '@/lib/projects/divisions'

export type DivisionFiltersProps = {
  value: ProjectDivision[]
  onChange: (value: ProjectDivision[]) => void
  className?: string
  dark?: boolean
}

export default function DivisionFilters({
  value,
  onChange,
  className,
  dark = false,
}: DivisionFiltersProps) {
  return (
    <FilterChips
      items={PROJECT_DIVISIONS}
      value={value}
      onChange={onChange}
      className={className}
      dark={dark}
      ariaLabel="Divisioni"
    />
  )
}
