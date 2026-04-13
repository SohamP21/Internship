import { Link } from 'react-router-dom';

const sizeClass = {
  sm: 'ui-btn--sm',
  md: 'ui-btn--md',
  lg: 'ui-btn--lg',
};

const variantClass = {
  primary: 'ui-btn--primary',
  ghost: 'ui-btn--ghost',
  danger: 'ui-btn--danger',
  inverse: 'ui-btn--inverse',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  onClick,
  to,
  type = 'button',
  disabled,
  className = '',
  ...rest
}) {
  const cls = `ui-btn ${variantClass[variant] || variantClass.primary} ${sizeClass[size] || sizeClass.md} ${className}`.trim()
    .replace(/\s+/g, ' ');

  const inner = (
    <>
      {icon ? <span className="ui-btn__icon">{icon}</span> : null}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {inner}
    </button>
  );
}
