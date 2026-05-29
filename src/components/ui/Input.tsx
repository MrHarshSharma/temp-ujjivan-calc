'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: string
  suffix?: string
}

export function Input({ label, error, hint, prefix, suffix, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-500 text-sm select-none">{prefix}</span>
        )}
        <input
          id={inputId}
          {...props}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-8' : ''}
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
              : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
            }
            disabled:bg-slate-50 disabled:text-slate-400
            ${className}`}
        />
        {suffix && (
          <span className="absolute right-3 text-slate-500 text-sm select-none">{suffix}</span>
        )}
      </div>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
