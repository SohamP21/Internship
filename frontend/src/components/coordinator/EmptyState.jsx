import Button from '../ui/Button';

const EmptyState = ({ onCreate }) => (
  <div className="admin-empty-state glass-card">
    <div className="admin-empty-state__icon" aria-hidden>
      +
    </div>
    <h2 className="admin-empty-state__title">No events yet</h2>
    <p className="admin-empty-state__copy">
      Create your first event to start managing registrations and judging.
    </p>
    <Button type="button" variant="primary" size="md" onClick={onCreate}>
      Create Event
    </Button>
  </div>
);

export default EmptyState;
