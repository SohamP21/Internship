/**
 * Framer Motion variants — single source; do not duplicate inline in components.
 */

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/** Stagger children must not stay at opacity 0 when the parent uses initial={false} (stagger can skip). */
export const staggerItem = {
  hidden: { opacity: 1, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** Route layer: enter fade up, exit opacity + scale (transform only). */
/** Do not name a variant `initial` — it clashes with the `initial` prop in Framer Motion and can leave routes invisible. */
export const routeLayer = {
  hidden: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const fade = {
  hidden: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** Auth error shake — transform only. */
export const shake = {
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

/** Badge pulsing dot — keyframe animation via animate prop (export only). */
export const BADGE_DOT_ANIMATE = {
  scale: [1, 1.4, 1],
  transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
};

export const navItemHover = { x: 3, transition: { duration: 0.2, ease: 'easeOut' } };

export const toastSlide = {
  hidden: { opacity: 0, x: 24, scale: 0.96 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 16,
    scale: 0.96,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const expandPanel = {
  collapsed: {
    opacity: 0,
    scaleY: 0.92,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
  open: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};
