const DashboardSkeleton = () => (
  <div className="ds-skeleton-root">
    <div className="ds-stat-row">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="ui-card ui-skeleton ds-skel-h-120" />
      ))}
    </div>
    <div className="ui-skeleton ds-mt-24 ds-skel-h-180 ds-skel-hero" />
    <div className="ds-dash-grid ds-mt-24">
      <div className="ds-events-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ui-card ui-skeleton ds-skel-h-200" />
        ))}
      </div>
      <div className="ui-card ui-skeleton ds-skel-h-220" />
    </div>
  </div>
);

export default DashboardSkeleton;
