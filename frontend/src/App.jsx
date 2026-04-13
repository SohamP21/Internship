import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { getMeApi, unwrapApiData } from './api/authApi';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { WorkspaceProvider } from './context/WorkspaceContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CreateEventPage from './pages/coordinator/CreateEventPage';
import ViewRegistrationsPage from './pages/coordinator/ViewRegistrationsPage';

import ParticipantDashboard from './pages/participant/EventListPage';
import RegisterTeamPage from './pages/participant/RegisterTeamPage';
import MyRegistrationsPage from './pages/participant/MyRegistrationsPage';

import JudgeDashboard from './pages/judge/JudgeDashboard';
import JudgeEventListPage from './pages/judge/EventListPage';
import JudgeOnboardingPage from './pages/judge/JudgeOnboardingPage';
import AssignTeamsPage from './pages/coordinator/AssignTeamsPage';

import MyAssignmentsPage from './pages/judge/MyAssignmentsPage';
import EvaluateTeamPage from './pages/judge/EvaluateTeamPage';
import ResultsPage from './pages/coordinator/ResultsPage';
import EvaluationProgressPage from './pages/coordinator/EvaluationProgressPage';
import ProfilePage from './pages/ProfilePage';
import MyScoresPage from './pages/participant/MyScoresPage';
import PendingEvaluationsPage from './pages/judge/PendingEvaluationsPage';
import EventDetailPage from './pages/EventDetailPage';
import CoordinatorAnalyticsPage from './pages/coordinator/CoordinatorAnalyticsPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-outlet">
      <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/coordinator/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/analytics"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/events/create"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/events/:eventId/registrations"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <ViewRegistrationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/events/:eventId/assign"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <AssignTeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/evaluation-progress"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <EvaluationProgressPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/participant/dashboard"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant/events/:eventId/register"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <RegisterTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant/my-registrations"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <MyRegistrationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant/my-scores"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <MyScoresPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/judge/dashboard"
            element={
              <ProtectedRoute allowedRoles={['judge']}>
                <JudgeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge/events"
            element={
              <ProtectedRoute allowedRoles={['judge']}>
                <JudgeEventListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge/pending-evaluations"
            element={
              <ProtectedRoute allowedRoles={['judge']}>
                <PendingEvaluationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge/events/:eventId/onboard"
            element={
              <ProtectedRoute allowedRoles={['judge']}>
                <JudgeOnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/judge/events/:eventId/assignments"
            element={
              <ProtectedRoute allowedRoles={['judge']}>
                <MyAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge/events/:eventId/assignments/:assignmentId/evaluate"
            element={
              <ProtectedRoute allowedRoles={['judge']}>
                <EvaluateTeamPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/coordinator/events/:eventId/results"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <ResultsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'participant', 'judge']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'participant', 'judge']}>
                <EventDetailPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>
  );
}

const App = () => {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    getMeApi()
      .then((res) => {
        const user = unwrapApiData(res);
        if (!user?.email) return;
        const prev = useAuthStore.getState().user;
        useAuthStore.getState().setUser({
          ...prev,
          ...user,
          role: user.role ?? prev?.role,
          email: user.email ?? prev?.email,
          name: user.name ?? prev?.name,
        });
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          useAuthStore.getState().logout();
          return;
        }
        // Post-login: keep token/user if /me hiccups (network/5xx). Refresh-with-token-only still logs out below.
        if (useAuthStore.getState().user) return;
        useAuthStore.getState().logout();
      });
  }, [token]);

  return (
    <BrowserRouter>
      <ToastProvider>
        <WorkspaceProvider>
          <AnimatedRoutes />
        </WorkspaceProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
