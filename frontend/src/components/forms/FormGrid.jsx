/**
 * CSS Grid wrapper for form fields (2 columns by default).
 */
export function FormGrid({ columns = 2, className = '', children }) {
  const cls =
    columns === 1
      ? 'form-grid-ds form-grid-ds--1'
      : 'form-grid-ds form-grid-ds--2';
  return <div className={`${cls} ${className}`.trim()}>{children}</div>;
}

export function FormGridFull({ children, className = '' }) {
  return <div className={`form-grid-ds__full ${className}`.trim()}>{children}</div>;
}

export default FormGrid;
