import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Input = forwardRef(function Input(
  { label, error, id, className = '', wrapperClassName = '', ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className={`ui-input-wrap ${wrapperClassName}`.trim()}>
      {label ? (
        <label className="ui-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <motion.input
        ref={ref}
        id={inputId}
        className={`ui-input ${className}`.trim()}
        whileFocus={{ scale: 1.005 }}
        transition={{ duration: 0.15 }}
        {...props}
      />
      {error ? <span className="ui-form-error">{error}</span> : null}
    </div>
  );
});

export default Input;
