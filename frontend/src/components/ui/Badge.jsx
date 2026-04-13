import { motion } from 'framer-motion';
import { BADGE_DOT_ANIMATE } from '../../lib/motion';

const VARIANT = {
  green: 'ui-badge--green',
  orange: 'ui-badge--orange',
  blue: 'ui-badge--blue',
  red: 'ui-badge--red',
  muted: 'ui-badge--muted',
};

const STATUS_MAP = {
  open: 'green',
  assigning: 'orange',
  judging: 'blue',
  completed: 'muted',
  closed: 'red',
  draft: 'muted',
};

export function statusToBadgeVariant(status) {
  const key = (status || '').toLowerCase();
  return STATUS_MAP[key] || 'muted';
}

export default function Badge({ label, variant, status, pulse }) {
  const v = variant || statusToBadgeVariant(status);
  const cls = VARIANT[v] || VARIANT.muted;
  const showPulse = pulse ?? ['open', 'judging'].includes((status || '').toLowerCase());

  return (
    <span className={`ui-badge ${cls}`}>
      {showPulse ? <motion.span className="ui-badge__dot" animate={BADGE_DOT_ANIMATE} /> : null}
      {label}
    </span>
  );
}
