import { memo } from 'react';
import CountUpPkg from 'react-countup';
import { useInView } from 'react-intersection-observer';
import Card from './Card';

/** Vite + CJS interop: default import can be `{ default: fn }` → invalid element type. */
const CountUp = typeof CountUpPkg === 'function' ? CountUpPkg : CountUpPkg?.default;

const ACCENT = ['green', 'orange', 'blue', 'red'];

const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  trend,
  accentColor = 'green',
}) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const accent = ACCENT.includes(accentColor) ? accentColor : 'green';
  const numeric = typeof value === 'number' ? value : Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;

  return (
    <div ref={ref}>
      <Card
        className="ui-stat-card"
        glowColor={accent === 'green' ? 'green' : accent === 'orange' ? 'orange' : accent === 'blue' ? 'blue' : undefined}
        data-accent={accent}
      >
        <div className="ui-stat-card__inner">
          {icon ? <div className="ui-stat-card__icon-wrap">{icon}</div> : null}
          <div className="ui-stat-card__top">
            <span className="ui-stat-card__label">{label}</span>
            <div className="ui-stat-card__value">
              {inView && CountUp ? (
                <CountUp end={safe} duration={1.2} preserveValue />
              ) : (
                String(inView ? safe : 0)
              )}
            </div>
          </div>
          {trend != null && typeof trend === 'object' ? (
            <span
              className={`ui-stat-card__trend ${trend.positive ? 'ui-stat-card__trend--up' : 'ui-stat-card__trend--down'}`}
            >
              {trend.positive ? '↗' : '↘'} {Math.abs(trend.percent)}%
            </span>
          ) : null}
        </div>
      </Card>
    </div>
  );
});

export default StatCard;
