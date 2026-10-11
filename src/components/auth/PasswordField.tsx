import { useState } from "react";

export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  error,
  required = true,
  showStrength = false,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
  required?: boolean;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const checks = [
    value.length >= 8,
    /[A-Za-z]/.test(value) && /\d/.test(value),
  ];
  const strength = value.length === 0 ? 0 : checks.filter(Boolean).length;

  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span className="required-mark"> *</span>}</label>
      <div className="password-input">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : showStrength ? `${id}-hint` : undefined}
          required={required}
        />
        <button
          className="password-input__toggle"
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength && (
        <div className="password-strength" id={`${id}-hint`}>
          <span className="password-strength__bars" aria-label={`Password strength ${strength} of 2`}>
            {[1, 2].map((bar) => <span className={strength >= bar ? "is-filled" : ""} key={bar} />)}
          </span>
          <span>At least 8 characters, with a letter and a number.</span>
        </div>
      )}
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
