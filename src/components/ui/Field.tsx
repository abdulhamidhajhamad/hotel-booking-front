import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && !error && <span className="small muted">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextInput({ label, error, hint, ...rest }: TextInputProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input className="input" {...rest} />
    </Field>
  );
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function SelectInput({ label, error, hint, children, ...rest }: SelectInputProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <select className="select" {...rest}>
        {children}
      </select>
    </Field>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextArea({ label, error, hint, ...rest }: TextAreaProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <textarea className="textarea" {...rest} />
    </Field>
  );
}
