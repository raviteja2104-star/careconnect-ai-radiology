import React from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export function Radio({ label, description, className = '', ...props }: RadioProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex h-5 items-center">
        <input
          type="radio"
          className="h-4 w-4 border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          {...props}
        />
      </div>
      {(label || description) && (
        <div>
          {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer" htmlFor={props.id}>{label}</label>}
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      )}
    </div>
  );
}

export interface RadioGroupProps {
  name: string;
  options: { value: string; label: string; description?: string }[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
}

export function RadioGroup({ name, options, value, onChange, label, className = '' }: RadioGroupProps) {
  return (
    <fieldset className={className}>
      {label && <legend className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</legend>}
      <div className="space-y-2">
        {options.map(opt => (
          <Radio
            key={opt.value}
            name={name}
            id={`${name}-${opt.value}`}
            value={opt.value}
            label={opt.label}
            description={opt.description}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
