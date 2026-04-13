const STATUS_CONFIG = {
  open: { label: 'Open', symbol: '●', className: 'admin-status-badge--open' },
  assigning: { label: 'Assigning', symbol: '●', className: 'admin-status-badge--assigning' },
  judging: { label: 'Judging', symbol: '●', className: 'admin-status-badge--judging' },
  completed: { label: 'Completed', symbol: '✓', className: 'admin-status-badge--completed' },
  draft: { label: 'Closed', symbol: '✗', className: 'admin-status-badge--closed' },
  closed: { label: 'Closed', symbol: '✗', className: 'admin-status-badge--closed' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.closed;

  return (
    <span className={`admin-status-badge ${config.className}`}>
      <span className="admin-status-badge__symbol" aria-hidden>
        {config.symbol}
      </span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
