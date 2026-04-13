import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import { expandPanel } from '../../lib/motion';

export function categoryToStripKey(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('tech')) return 'tech';
  if (c.includes('cultural')) return 'cultural';
  if (c.includes('sport')) return 'sports';
  if (c.includes('workshop')) return 'workshop';
  return 'default';
}

function buildMeta({ startDate, endDate, deadline, registeredCount, totalSlots, metadataLine }) {
  if (metadataLine) return metadataLine;
  const parts = [];
  if (startDate && endDate) parts.push(`${startDate} – ${endDate}`);
  else if (startDate || endDate) parts.push(startDate || endDate);
  if (deadline) parts.push(`Reg. deadline ${deadline}`);
  if (registeredCount != null && totalSlots != null) {
    parts.push(`${registeredCount} / ${totalSlots} slots`);
  } else if (registeredCount != null) {
    parts.push(`${registeredCount} registered`);
  }
  return parts.join('  ·  ');
}

const EventCard = memo(function EventCard({
  title,
  status,
  category,
  startDate,
  endDate,
  deadline,
  tags = [],
  maxTags = 3,
  registeredCount,
  totalSlots,
  metadataLine,
  actions,
  primaryAction,
  primaryActionLoading = false,
  primaryActionLoadingLabel = 'Please wait…',
  certificatesIssuedCount,
  expandContent,
  expandToggleLabelOpen = 'Hide details',
  expandToggleLabelClosed = 'View slots & rubric',
  glowColor,
}) {
  const [expanded, setExpanded] = useState(false);
  const strip = categoryToStripKey(category);
  const meta = useMemo(
    () =>
      buildMeta({
        startDate,
        endDate,
        deadline,
        registeredCount,
        totalSlots,
        metadataLine,
      }),
    [startDate, endDate, deadline, registeredCount, totalSlots, metadataLine]
  );

  const visibleTags = tags.slice(0, maxTags);
  const extra = Math.max(tags.length - visibleTags.length, 0);

  const hasExpand = Boolean(expandContent);

  return (
    <Card className="ui-event-card" glowColor={glowColor}>
      <span className={`ui-event-card__strip ui-event-card__strip--${strip}`} aria-hidden />
      <div className="ui-event-card__head">
        <h3 className="ui-event-card__title">{title}</h3>
        <div className="ui-event-card__head-actions">
          <Badge label={(status || '').toUpperCase()} status={status} />
          {status === 'completed' &&
          certificatesIssuedCount != null &&
          Number(certificatesIssuedCount) > 0 ? (
            <span className="ui-event-card__cert-pill" title="Certificates issued to team leads">
              <Award size={14} strokeWidth={2} aria-hidden />
              Certificates Sent · {certificatesIssuedCount}
            </span>
          ) : null}
          {primaryAction ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={primaryAction.onClick}
              disabled={primaryActionLoading}
            >
              {primaryActionLoading ? primaryActionLoadingLabel : primaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>

      <p className="ui-event-card__meta">{meta}</p>

      {tags.length > 0 ? (
        <div className="ui-event-card__tags">
          {visibleTags.map((tag) => (
            <span key={tag} className="ui-event-card__tag">
              {tag}
            </span>
          ))}
          {extra > 0 ? (
            <span className="ui-event-card__tag ui-event-card__tag--more">+{extra}</span>
          ) : null}
        </div>
      ) : null}

      {hasExpand ? (
        <button type="button" className="ui-event-card__toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? expandToggleLabelOpen : expandToggleLabelClosed}
        </button>
      ) : null}

      {actions ? <div className="ui-event-card__actions">{actions}</div> : null}

      <AnimatePresence initial={false}>
        {hasExpand && expanded ? (
          <motion.div
            key="expand"
            className="ui-event-card__expand"
            variants={expandPanel}
            initial="collapsed"
            animate="open"
            exit="collapsed"
          >
            <div className="ui-event-card__expand-inner">{expandContent}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
});

export default EventCard;
