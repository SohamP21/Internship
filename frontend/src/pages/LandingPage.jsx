import { Link } from 'react-router-dom';
import useThemeStore from '../store/themeStore';

const LandingPage = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="landing">
      <div className="landing-glow landing-glow-1" aria-hidden />
      <div className="landing-glow landing-glow-2" aria-hidden />
      <div className="landing-grid" aria-hidden />

      <header className="landing-header">
        <span className="landing-brand gradient-text">✦ Eventify</span>
        <div className="landing-header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/login" className="btn btn-ghost btn-sm">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <p className="landing-kicker">Hackathons · Competitions · Judging</p>
          <h1 className="landing-headline">
            Run events with <span className="gradient-text">clarity</span> and{' '}
            <span className="gradient-text">confidence</span>
          </h1>
          <p className="landing-lede">
            Coordinate registrations, assign teams to judges, collect scores, and publish results — all in one
            glassmorphic workspace built for fast-moving campus events.
          </p>
          <div className="landing-cta-row">
            <Link to="/register" className="btn btn-primary btn-lg">
              Create an account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              I already have access
            </Link>
          </div>
        </section>

        <section className="landing-features" aria-label="Features">
          <article className="glass-card landing-card">
            <div className="landing-card-icon" aria-hidden>
              🎯
            </div>
            <h2 className="landing-card-title">Coordinators</h2>
            <p className="landing-card-text">
              Create events, watch registrations roll in, assign teams to judges, and export results when the dust
              settles.
            </p>
          </article>
          <article className="glass-card landing-card">
            <div className="landing-card-icon" aria-hidden>
              🚀
            </div>
            <h2 className="landing-card-title">Participants</h2>
            <p className="landing-card-text">
              Register your team for the right slot, track your submissions, and stay aligned with event timelines.
            </p>
          </article>
          <article className="glass-card landing-card">
            <div className="landing-card-icon" aria-hidden>
              ⚖️
            </div>
            <h2 className="landing-card-title">Judges</h2>
            <p className="landing-card-text">
              See only what you are assigned, score with structured rubrics, and move through evaluations without
              friction.
            </p>
          </article>
        </section>
      </main>

      <footer className="landing-footer">
        <span className="landing-footer-brand">Eventify</span>
        <span className="landing-footer-meta">Built for in-house events and student competitions</span>
      </footer>

      <style>{`
        .landing {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
          background: var(--bg-base);
        }
        .landing-glow {
          position: fixed;
          pointer-events: none;
          z-index: 0;
          border-radius: 50%;
          filter: blur(80px);
        }
        .landing-glow-1 {
          top: -15%;
          left: -10%;
          width: 55vw;
          height: 55vw;
          max-width: 720px;
          max-height: 720px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 65%);
        }
        .landing-glow-2 {
          bottom: -20%;
          right: -15%;
          width: 50vw;
          height: 50vw;
          max-width: 640px;
          max-height: 640px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, transparent 65%);
        }
        .landing-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 55% at 50% 30%, black 20%, transparent 100%);
          pointer-events: none;
        }
        .landing-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1100px;
          width: 100%;
          margin: 0 auto;
          padding: 1.25rem 1.5rem;
        }
        .landing-brand {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .landing-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-sm {
          padding: 0.45rem 0.95rem;
          font-size: 0.875rem;
        }
        .btn-lg {
          padding: 0.75rem 1.35rem;
          font-size: 0.95rem;
        }
        .landing-main {
          position: relative;
          z-index: 1;
          flex: 1;
          max-width: 1100px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem 1.5rem 3rem;
        }
        .landing-hero {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 3rem;
        }
        .landing-kicker {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        .landing-headline {
          font-size: clamp(2rem, 5vw, 2.75rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.04em;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        .landing-lede {
          font-size: 1.05rem;
          line-height: 1.65;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        .landing-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }
        .landing-features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .landing-features {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.25rem;
          }
        }
        .landing-card {
          padding: 1.35rem 1.25rem;
          height: 100%;
          transition: border-color var(--transition-base), box-shadow var(--transition-base);
        }
        .landing-card:hover {
          border-color: var(--card-hover-border);
          box-shadow: var(--shadow-md);
        }
        .landing-card-icon {
          font-size: 1.75rem;
          margin-bottom: 0.65rem;
        }
        .landing-card-title {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .landing-card-text {
          font-size: 0.9rem;
          line-height: 1.55;
          color: var(--text-secondary);
        }
        .landing-footer {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 2rem 1.5rem;
          border-top: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .landing-footer-brand {
          font-weight: 700;
          color: var(--text-secondary);
        }
        .landing-footer-meta {
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
