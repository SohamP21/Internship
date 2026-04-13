import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const glowClass = {
  green: 'ui-card--glow-green',
  orange: 'ui-card--glow-orange',
  blue: 'ui-card--glow-blue',
};

const Card = forwardRef(function Card(
  { children, className = '', glowColor, as: Component = motion.article, ...rest },
  ref
) {
  const glow = glowColor ? glowClass[glowColor] : '';
  return (
    <Component
      ref={ref}
      className={`ui-card ${glow} ${className}`.trim()}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.99 }}
      {...rest}
    >
      {children}
    </Component>
  );
});

export default Card;
