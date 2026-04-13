import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfilesApi } from '../../api/judgeApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';
import PageShell from '../../components/ui/PageShell';
import HeroBanner from '../../components/ui/HeroBanner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const JudgeDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfilesApi()
      .then((res) => setProfiles(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout maxWidth="medium">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading your dashboard…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="medium">
      <PageShell>
        <HeroBanner
          greeting={`Hello, ${user?.name?.split(' ')[0] || 'Judge'}`}
          subtitle="Your assigned events and slots appear below. Open evaluations when judging is live."
        />

        <div className="ds-mt-24 page-header">
          <div className="page-header-info">
            <h2 className="gradient-text">Assignments</h2>
            <p>Welcome back, {user?.name} — review your roster and jump in when ready.</p>
          </div>
          <div className="page-header-actions">
            <Button type="button" variant="ghost" size="md" onClick={() => navigate('/judge/events')}>
              Browse Events
            </Button>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="empty-state glass-card no-hover">
            <div className="empty-state-icon">⚖️</div>
            <h3>No events signed up for</h3>
            <p>Browse events and sign up to judge</p>
            <Button type="button" variant="primary" size="md" onClick={() => navigate('/judge/events')}>
              Browse Events
            </Button>
          </div>
        ) : null}

        <div className="ds-stack-gap ds-mt-24">
          {profiles.map((profile) => {
            const event = profile.eventId;
            const slot = event?.slots?.find((s) => s.slotNumber === profile.slotNumber);

            return (
              <Card key={profile._id}>
                <div className="ds-judge-card-head">
                  <div>
                    <h3 className="ds-judge-card-title">{event?.title}</h3>
                    <Badge label={(event?.status || '').toUpperCase()} status={event?.status} />
                  </div>
                  {event?.status === 'judging' ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/judge/events/${event._id}/assignments`)}
                    >
                      Evaluate Teams
                    </Button>
                  ) : null}
                </div>

                <div className="ds-judge-domains">
                  <div className="section-label">Your domains</div>
                  <div className="ds-domain-tags">
                    {profile.domains.map((d) => (
                      <span key={d} className="domain-tag">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {slot ? (
                  <div className="slot-callout">
                    <p>
                      <strong>Your slot:</strong> Slot {slot.slotNumber} ·{' '}
                      {new Date(slot.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {slot.startTime} – {slot.endTime}
                    </p>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </PageShell>
    </Layout>
  );
};

export default JudgeDashboard;
