import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  CalendarDays,
  ClipboardList,
  Users,
  Gavel,
  Trophy,
  CheckCircle,
  Download,
  UserCircle,
  Layers,
  FileStack,
  Timer,
  Star,
  Award,
  History,
  PieChart,
  ListTodo,
  BarChart3,
  Clock,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useWorkspace } from '../context/WorkspaceContext';
import { navItemHover, slideInLeft } from '../lib/motion';

const roleLabels = {
  coordinator: 'Coordinator',
  participant: 'Participant',
  judge: 'Judge',
};

const dashboardPaths = {
  coordinator: '/coordinator/dashboard',
  participant: '/participant/dashboard',
  judge: '/judge/dashboard',
};

const userInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function pickEventId(ops, predicate) {
  const list = ops?.perEvent?.length
    ? ops.perEvent
    : ops?.events?.length
      ? ops.events
      : ops?.event
        ? [{ ...ops.event, status: ops.event.status }]
        : [];
  const hit = list.find(predicate);
  return hit?._id != null ? String(hit._id) : null;
}

function SidebarLink({ to, end, icon: Icon, label, count, badge }) {
  return (
    <motion.div whileHover={navItemHover}>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `ds-sidebar__link ${isActive ? 'active' : ''}`.trim()}
      >
        {Icon ? <Icon size={16} strokeWidth={2} aria-hidden /> : null}
        <span className="ds-sidebar__link-label">{label}</span>
        {badge ? <span className="ds-sidebar__link-badge">{badge}</span> : null}
        {count != null && count !== '' ? (
          <span className="ds-sidebar__link-count">{count}</span>
        ) : null}
      </NavLink>
    </motion.div>
  );
}

function SectionLabel({ children }) {
  return <div className="ds-sidebar__section-label">{children}</div>;
}

function StageBadges({ ops, role }) {
  if (role !== 'coordinator' || !ops?.counts) return null;
  const c = ops.counts;
  return (
    <div className="ds-sidebar__badges" aria-label="Event stage summary">
      {c.openRegistrationsEvents > 0 ? (
        <span className="ds-sidebar__badge ds-sidebar__badge--open">
          Open {c.openRegistrationsEvents}
        </span>
      ) : null}
      {c.assigningEvents > 0 ? (
        <span className="ds-sidebar__badge ds-sidebar__badge--assign">
          Assign {c.assigningEvents}
        </span>
      ) : null}
      {c.judgingEvents > 0 ? (
        <span className="ds-sidebar__badge ds-sidebar__badge--judge">
          Judge {c.judgingEvents}
        </span>
      ) : null}
      {c.completedEvents > 0 ? (
        <span className="ds-sidebar__badge ds-sidebar__badge--done">
          Done {c.completedEvents}
        </span>
      ) : null}
    </div>
  );
}

function EventSelector({ role, ops, activeEventId, setActiveEventId }) {
  if (role !== 'coordinator' && role !== 'judge') return null;
  const events = ops?.events || [];
  if (events.length === 0) return null;

  return (
    <div className="ds-sidebar__event-select">
      <label className="ds-sidebar__event-select-label" htmlFor="workspace-event">
        Active event
      </label>
      <select
        id="workspace-event"
        className="ds-sidebar__select"
        value={activeEventId || ''}
        onChange={(e) => setActiveEventId(e.target.value || null)}
      >
        <option value="">All events (workspace)</option>
        {events.map((ev) => (
          <option key={String(ev._id)} value={String(ev._id)}>
            {ev.title}
            {ev.status ? ` · ${ev.status}` : ''}
          </option>
        ))}
      </select>
      {ops?.counts?.dueSoon48h > 0 ? (
        <p className="ds-sidebar__risk-hint">
          <Timer size={12} aria-hidden />
          {ops.counts.dueSoon48h} registration deadline
          {ops.counts.dueSoon48h !== 1 ? 's' : ''} within 48h
        </p>
      ) : null}
    </div>
  );
}

function ProgressMini({ label, value }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="ds-sidebar__progress-row">
      <span className="ds-sidebar__progress-label">{label}</span>
      <div className="ds-sidebar__progress-bar" role="presentation">
        <div className="ds-sidebar__progress-fill" style={{ width: `${v}%` }} />
      </div>
      <span className="ds-sidebar__progress-pct">{v}%</span>
    </div>
  );
}

function CoordinatorNav({ ops, activeEventId }) {
  const eid = activeEventId || pickEventId(ops, (e) => e.status === 'open');
  const assignId =
    activeEventId || pickEventId(ops, (ev) => ev.status === 'assigning');
  const resultsId =
    activeEventId ||
    pickEventId(ops, (ev) => ev.status === 'judging' || ev.status === 'completed');

  const c = ops?.counts || {};
  const p = ops?.percentages || {};
  const pending = c.pendingEvaluations;
  const unassignedTotal = activeEventId
    ? c.teamsUnassigned
    : ops?.perEvent?.reduce((s, x) => s + (x.teamsUnassigned || 0), 0);
  const openRegCount =
    ops?.scope === 'event'
      ? ops.event?.status === 'open'
        ? c.totalRegistrations
        : undefined
      : c.openRegistrationsEvents;
  const overloadedJudges = ops?.judges?.filter((j) => j.status === 'overloaded').length;

  return (
    <>
      <SectionLabel>Overview</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Overview">
        <SidebarLink to="/coordinator/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <SidebarLink
          to="/coordinator/dashboard"
          icon={Layers}
          label="My Events"
          count={c.myEvents ?? '—'}
        />
        <SidebarLink to="/coordinator/analytics" icon={BarChart3} label="Analytics" />
      </nav>

      <SectionLabel>Work queue</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Work queue">
        <SidebarLink
          to={eid ? `/coordinator/events/${eid}/registrations` : '/coordinator/dashboard'}
          icon={ClipboardList}
          label="Open registrations"
          count={openRegCount}
        />
        <SidebarLink
          to={
            assignId
              ? `/coordinator/events/${assignId}/assign`
              : '/coordinator/dashboard'
          }
          icon={Users}
          label="Assignment board"
          count={unassignedTotal != null ? unassignedTotal : undefined}
        />
        <SidebarLink
          to="/coordinator/evaluation-progress#judges"
          icon={Gavel}
          label="Judge capacity"
          count={overloadedJudges > 0 ? overloadedJudges : undefined}
        />
        <SidebarLink
          to="/coordinator/evaluation-progress"
          icon={ListTodo}
          label="Evaluation progress"
          count={pending != null ? pending : undefined}
        />
        <SidebarLink
          to={
            resultsId
              ? `/coordinator/events/${resultsId}/results`
              : '/coordinator/dashboard'
          }
          icon={Trophy}
          label="Results & rankings"
        />
      </nav>

      <SectionLabel>Insights</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Insights">
        <div className="ds-sidebar__panel">
          <ProgressMini label="Assigned teams" value={p.assignmentCoverage} />
          <ProgressMini label="Evaluations" value={p.evaluationCoverage} />
        </div>
        {ops?.topDomains?.length ? (
          <div className="ds-sidebar__domains">
            <span className="ds-sidebar__domains-title">Top domains</span>
            <ul>
              {ops.topDomains.slice(0, 4).map((d) => (
                <li key={d.domain}>
                  {d.domain}{' '}
                  <span className="ds-sidebar__domains-count">{d.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      <SectionLabel>History</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="History">
        <SidebarLink
          to="/coordinator/dashboard"
          icon={CheckCircle}
          label="Completed events"
          count={c.completedEvents ?? 0}
        />
        <SidebarLink
          to="/coordinator/dashboard"
          icon={Download}
          label="Reports & export"
        />
      </nav>

      <SectionLabel>Profile</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Profile">
        <SidebarLink to="/profile" icon={UserCircle} label="Profile" />
        <SidebarLink
          to="/coordinator/events/create"
          icon={PlusCircle}
          label="Create event"
        />
      </nav>
    </>
  );
}

function ParticipantNav({ ops }) {
  const c = ops?.counts || {};
  const certCount = Number(c.certificatesEarned) || 0;
  return (
    <>
      <SectionLabel>Overview</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Overview">
        <SidebarLink to="/participant/dashboard" icon={CalendarDays} label="Browse events" />
        <SidebarLink
          to="/participant/my-registrations"
          icon={ClipboardList}
          label="My registrations"
          count={c.myRegistrations ?? '—'}
        />
      </nav>

      <SectionLabel>Work queue</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Work queue">
        <SidebarLink
          to="/participant/my-registrations"
          icon={FileStack}
          label="My submissions"
          badge={`PPT ${c.submissionsWithPpt ?? 0} · abs ${c.submissionsWithAbstract ?? 0} · links ${c.submissionsWithLinks ?? 0}`}
        />
      </nav>

      <SectionLabel>Insights</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Insights">
        <SidebarLink
          to="/participant/my-scores"
          icon={Star}
          label="My scores"
          count={c.evaluatedTeams ?? 0}
        />
      </nav>

      {certCount > 0 ? (
        <>
          <SectionLabel>History</SectionLabel>
          <nav className="ds-sidebar__nav" aria-label="History">
            <SidebarLink
              to="/profile#my-certificates"
              icon={Award}
              label="Certificates"
              count={certCount}
            />
          </nav>
        </>
      ) : null}

      <SectionLabel>Profile</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Profile">
        <SidebarLink to="/profile" icon={UserCircle} label="Profile" />
      </nav>
    </>
  );
}

function JudgeNav({ ops, activeEventId }) {
  const c = ops?.counts || {};
  const assignEvent =
    activeEventId ||
    pickEventId(ops, (e) => e.status === 'judging') ||
    pickEventId(ops, () => true);

  return (
    <>
      <SectionLabel>Overview</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Overview">
        <SidebarLink to="/judge/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <SidebarLink
          to="/judge/events"
          icon={CalendarDays}
          label="My events"
          count={c.myEvents ?? '—'}
        />
      </nav>

      <SectionLabel>Work queue</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Work queue">
        <SidebarLink to="/judge/dashboard" icon={Clock} label="My slots" />
        <SidebarLink
          to="/judge/pending-evaluations"
          icon={ListTodo}
          label="Pending evaluations"
          count={c.pendingEvaluations ?? 0}
        />
        <SidebarLink
          to={
            assignEvent
              ? `/judge/events/${assignEvent}/assignments`
              : '/judge/events'
          }
          icon={CheckCircle}
          label="Submitted evaluations"
          count={c.totalEvaluationsSubmitted ?? 0}
        />
      </nav>

      <SectionLabel>Insights</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Insights">
        <SidebarLink
          to={
            assignEvent
              ? `/judge/events/${assignEvent}/assignments`
              : '/judge/events'
          }
          icon={PieChart}
          label="Domain coverage"
        />
      </nav>

      <SectionLabel>History</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="History">
        <SidebarLink
          to={
            assignEvent
              ? `/judge/events/${assignEvent}/assignments`
              : '/judge/events'
          }
          icon={History}
          label="Evaluation history"
        />
      </nav>

      <SectionLabel>Profile</SectionLabel>
      <nav className="ds-sidebar__nav" aria-label="Profile">
        <SidebarLink to="/profile" icon={UserCircle} label="Profile" />
      </nav>
    </>
  );
}

export default function AppSidebar() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { activeEventId, setActiveEventId, opsSummary, opsLoading } = useWorkspace();

  const goHome = () => {
    if (user?.role && dashboardPaths[user.role]) {
      navigate(dashboardPaths[user.role]);
    }
  };

  if (!token || !user) return null;

  const profile = { to: '/profile', label: 'Profile' };

  return (
    <motion.aside
      className="ds-sidebar ds-sidebar--control"
      variants={slideInLeft}
      initial={false}
      animate="visible"
    >
      <div className="ds-sidebar__scroll">
        <div className="ds-sidebar__logo" onClick={goHome} role="presentation">
          <span className="ds-sidebar__logo-event">Event</span>
          <span className="ds-sidebar__logo-ify">ify</span>
        </div>

        <EventSelector
          role={user.role}
          ops={opsSummary}
          activeEventId={activeEventId}
          setActiveEventId={setActiveEventId}
        />

        <StageBadges ops={opsSummary} role={user.role} />

        {opsLoading ? (
          <p className="ds-sidebar__sync ui-muted">Updating status…</p>
        ) : null}

        {user.role === 'coordinator' ? (
          <CoordinatorNav ops={opsSummary} activeEventId={activeEventId} />
        ) : null}
        {user.role === 'participant' ? <ParticipantNav ops={opsSummary} /> : null}
        {user.role === 'judge' ? (
          <JudgeNav ops={opsSummary} activeEventId={activeEventId} />
        ) : null}
      </div>

      <NavLink
        to={profile.to}
        className={({ isActive }) => `ds-sidebar__footer ${isActive ? 'active' : ''}`.trim()}
      >
        <span className="ds-sidebar__avatar" aria-hidden>
          {userInitials(user.name)}
        </span>
        <span className="ds-sidebar__user-text">
          <span className="ds-sidebar__user-name">{user.name}</span>
          <span className="ds-sidebar__user-role">{roleLabels[user.role] || user.role}</span>
        </span>
      </NavLink>
    </motion.aside>
  );
}
