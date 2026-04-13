import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

const LandingPage = () => {
  return (
    <div className="landing">
      <div className="landing-vignette" aria-hidden />
      <div className="landing-noise" aria-hidden />
      <div className="landing-glow landing-glow-1" aria-hidden />
      <div className="landing-glow landing-glow-2" aria-hidden />
      <div className="landing-grid" aria-hidden />

      <header className="landing-header">
        <span className="landing-brand">
          <span className="landing-brand-mark" aria-hidden>
            ✦
          </span>
          <span className="gradient-text">Eventify</span>
        </span>
        <div className="landing-header-actions">
          <Button to="/login" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button to="/register" variant="primary" size="sm">
            Get started
          </Button>
        </div>
      </header>

      <PageShell>
        <main className="landing-main">
          <section className="landing-hero" aria-labelledby="landing-headline">
            <div className="landing-hero-layout">
              <div className="landing-hero-copy">
                <div className="landing-hero-badge">
                  <span className="landing-hero-badge-dot" />
                  Live for campus
                </div>
                <p className="landing-kicker">Registrations · Judging · Results</p>
                <h1 id="landing-headline" className="landing-headline">
                  Run campus events with{' '}
                  <span className="gradient-text">clarity and control</span>
                </h1>
                <p className="landing-lede">
                  Eventify brings coordinators, participants, and judges onto one workflow: structured
                  sign-ups, fair evaluations, and transparent outcomes—without relying on scattered
                  spreadsheets and manual follow-up.
                </p>
                <div className="landing-cta-row">
                  <Button to="/register" variant="primary" size="lg">
                    Create an account
                  </Button>
                  <Button to="/login" variant="ghost" size="lg">
                    Sign in to your workspace
                  </Button>
                </div>
              </div>

              <div className="landing-hero-visual" aria-hidden>
                <div className="landing-hero-stack">
                  <div className="landing-hero-panel landing-hero-panel--a">
                    <span className="landing-hero-panel-label">Coordinator</span>
                    <span className="landing-hero-panel-line" />
                    <span className="landing-hero-panel-line landing-hero-panel-line--short" />
                  </div>
                  <div className="landing-hero-panel landing-hero-panel--b">
                    <span className="landing-hero-panel-label">Participant</span>
                    <span className="landing-hero-panel-line" />
                    <span className="landing-hero-panel-line landing-hero-panel-line--mid" />
                  </div>
                  <div className="landing-hero-panel landing-hero-panel--c">
                    <span className="landing-hero-panel-label">Judge</span>
                    <span className="landing-hero-panel-line" />
                    <span className="landing-hero-panel-line landing-hero-panel-line--short" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="landing-stats" aria-label="Platform overview">
            <div className="landing-stat">
              <div className="landing-stat-value landing-stat-value--green">3</div>
              <div className="landing-stat-label">Dedicated roles</div>
            </div>
            <div className="landing-stat landing-stat--divider">
              <div className="landing-stat-value landing-stat-value--blue">1</div>
              <div className="landing-stat-label">End-to-end pipeline</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value landing-stat-value--muted">∞</div>
              <div className="landing-stat-label">Events you can host</div>
            </div>
          </div>

          <section className="landing-features" aria-label="Who Eventify serves">
            <article className="landing-card landing-card--accent-green">
              <div className="landing-card-icon-wrap" aria-hidden>
                <span className="landing-card-monogram">C</span>
              </div>
              <h2 className="landing-card-title">Coordinators</h2>
              <p className="landing-card-text">
                Publish events, manage registration windows, assign teams to judges, and finalize outcomes
                with a clear audit trail from draft to completion.
              </p>
            </article>
            <article className="landing-card landing-card--accent-blue">
              <div className="landing-card-icon-wrap" aria-hidden>
                <span className="landing-card-monogram">P</span>
              </div>
              <h2 className="landing-card-title">Participants</h2>
              <p className="landing-card-text">
                Register teams, choose suitable time slots, and meet submission requirements with deadlines
                and deliverables visible in one place.
              </p>
            </article>
            <article className="landing-card landing-card--accent-orange">
              <div className="landing-card-icon-wrap" aria-hidden>
                <span className="landing-card-monogram">J</span>
              </div>
              <h2 className="landing-card-title">Judges</h2>
              <p className="landing-card-text">
                Access only the work assigned to you, apply consistent rubric-based scores, and complete
                evaluations efficiently and fairly.
              </p>
            </article>
          </section>
        </main>
      </PageShell>

      <footer className="landing-footer">
        <span className="landing-footer-brand">Eventify</span>
        <span className="landing-footer-meta">Purpose-built for campus programmes and student competitions</span>
      </footer>
    </div>
  );
};

export default LandingPage;
