import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { getAnalyticsOverviewApi } from '../../api/analyticsApi';
import Layout from '../../components/Layout';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

const STATUS_BAR_COLORS = {
  open: '#4ade80',
  assigning: '#f97316',
  judging: '#60a5fa',
  completed: '#64748b',
};

const PIE_COLORS = ['#4ade80', '#60a5fa', '#f97316', '#a78bfa', '#f472b6', '#94a3b8'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="recharts-tooltip-box">
      {label != null ? <div>{label}</div> : null}
      {payload.map((p) => {
        const key = p.dataKey || p.name;
        const lbl =
          key === 'registrations' || key === 'cumulative'
            ? key === 'registrations'
              ? 'Registrations'
              : 'Cumulative'
            : p.name || key;
        return (
          <div key={String(key)}>
            {lbl}: {p.value}
          </div>
        );
      })}
    </div>
  );
}

const axisProps = {
  stroke: 'var(--text-secondary)',
  tick: { fill: 'var(--text-secondary)', fontSize: 11 },
};

const CoordinatorAnalyticsPage = () => {
  const { push: toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await getAnalyticsOverviewApi();
      setData(res.data.data);
    } catch (e) {
      toast(e.response?.data?.message || 'Could not load analytics', 'error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <Layout maxWidth="wide" pageTitle="Analytics">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading analytics…</span>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout maxWidth="wide" pageTitle="Analytics">
        <div className="alert alert-danger">No analytics data available.</div>
        <Link to="/coordinator/dashboard" className="btn btn-ghost">
          ← Dashboard
        </Link>
      </Layout>
    );
  }

  const { barByEvent, categoryPie, registrationsOverTime, stats } = data;

  const barData = (barByEvent || []).map((row) => ({
    ...row,
    fill: STATUS_BAR_COLORS[row.status] || STATUS_BAR_COLORS.completed,
  }));

  return (
    <Layout maxWidth="wide" pageTitle="Analytics">
      <div className="page-header mb-1">
        <div className="page-header-info">
          <h2 className="gradient-text">Analytics</h2>
          <p className="form-hint mb-0">All events — registrations and distribution</p>
        </div>
        <Link to="/coordinator/dashboard" className="btn btn-secondary btn-sm">
          Dashboard
        </Link>
      </div>

      <div className="analytics-stat-row analytics-fade-up analytics-fade-up--1">
        <StatCard label="Total events" value={stats.totalEvents} />
        <StatCard label="Total registrations" value={stats.totalRegistrations} />
        <StatCard label="Avg per event" value={stats.avgRegistrationsPerEvent} />
        <Card className="ui-stat-card analytics-popular-card" glowColor="blue">
          <div className="ui-stat-card__inner">
            <div className="ui-stat-card__top">
              <span className="ui-stat-card__label">Most popular event</span>
              <div className="ui-stat-card__value">{stats.mostPopularEventName || '—'}</div>
            </div>
            <p className="form-hint mb-0">
              {stats.mostPopularEventCount != null ? `${stats.mostPopularEventCount} signups` : ''}
            </p>
          </div>
        </Card>
      </div>

      <div className="analytics-chart-card analytics-fade-up analytics-fade-up--2">
        <h3 className="analytics-chart-card__title">Registrations by event</h3>
        <div className="analytics-chart-inner analytics-chart-inner--tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" {...axisProps} interval={0} angle={-28} textAnchor="end" height={70} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="registrations" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-chart-card analytics-fade-up analytics-fade-up--3">
        <h3 className="analytics-chart-card__title">Events by category</h3>
        <div className="analytics-chart-inner">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={96}
                paddingAngle={2}
              >
                {categoryPie.map((_, index) => (
                  <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-chart-card analytics-fade-up analytics-fade-up--4">
        <h3 className="analytics-chart-card__title">Cumulative registrations over time</h3>
        <div className="analytics-chart-inner">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={registrationsOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="var(--accent-blue)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default CoordinatorAnalyticsPage;
