'use client'

import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors bg-white
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
            : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
          }
          disabled:bg-slate-50 disabled:text-slate-400
          ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
