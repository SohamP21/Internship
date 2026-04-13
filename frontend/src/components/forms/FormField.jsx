import { memo } from 'react';

const FormField = memo(function FormField({
  sectionLabel,
  label,
  htmlFor,
  error,
  children,
  spanFull = false,
  className = '',
}) {
  return (
    <div
      className={`form-field-cell ${spanFull ? 'form-field-cell--full' : ''} ${className}`.trim()}
    >
      {sectionLabel ? (
        <p className="form-section-label" id={htmlFor ? `${htmlFor}-section` : undefined}>
          {sectionLabel}
        </p>
      ) : null}
      {label ? (
        <label className="form-field-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? <span className="form-field-error">{error}</span> : null}
    </div>
  );
});

export default FormField;
