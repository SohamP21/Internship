import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getEventByIdApi } from '../api/eventApi';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getEventByIdApi(eventId)
      .then((res) => {
        if (!cancelled) setEvent(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this event.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <Layout maxWidth="medium" pageTitle="Event">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading event…</span>
        </div>
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout maxWidth="medium" pageTitle="Event">
        <div className="alert alert-danger">{error || 'Event not found'}</div>
        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
          Go back
        </button>
      </Layout>
    );
  }

  const coordId = event.coordinatorId?._id || event.coordinatorId;
  const isOwner = user?.role === 'coordinator' && coordId && String(coordId) === String(user._id);

  const start =
    event.eventStartDate != null
      ? new Date(event.eventStartDate).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null;
  const end =
    event.eventEndDate != null
      ? new Date(event.eventEndDate).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null;

  return (
    <Layout maxWidth="medium" pageTitle={event.title || 'Event'}>
      <div className="glass-card no-hover">
        <p className="form-hint mb-1">{(event.category || 'General') + ' · ' + (event.status || '').toUpperCase()}</p>
        <h2 className="gradient-text mb-1">{event.title}</h2>
        {event.description ? <p className="mb-1">{event.description}</p> : null}
        {start && end ? (
          <p className="form-hint mb-1">
            {start} → {end}
          </p>
        ) : null}
        <div className="form-preview-tags mb-1">
          {(event.domains || []).map((d) => (
            <span key={d} className="form-preview-tag">
              {d}
            </span>
          ))}
        </div>

        <div className="event-detail-actions">
          {user?.role === 'participant' && event.status === 'open' ? (
            <Link to={`/participant/events/${event._id}/register`} className="btn btn-primary">
              Register team
            </Link>
          ) : null}
          {user?.role === 'judge' ? (
            <Link to={`/judge/events/${event._id}/onboard`} className="btn btn-secondary">
              Event onboarding
            </Link>
          ) : null}
          {isOwner ? (
            <Link to={`/coordinator/events/${event._id}/registrations`} className="btn btn-secondary">
              Manage registrations
            </Link>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
