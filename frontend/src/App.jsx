import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { getMeApi, unwrapApiData } from './api/authApi';
import ProtectedRoute from './components/ProtectedRoute';

// Auth & marketing
import LandingPage  from './pages/LandingPage';
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Coordinator
import CoordinatorDashboard    from './pages/coordinator/CoordinatorDashboard';
import CreateEventPage         from './pages/coordinator/CreateEventPage';
import ViewRegistrationsPage   from './pages/coordinator/ViewRegistrationsPage';

// Participant
import ParticipantDashboard  from './pages/participant/EventListPage';
import RegisterTeamPage      from './pages/participant/RegisterTeamPage';
import MyRegistrationsPage   from './pages/participant/MyRegistrationsPage';

// Judge
import JudgeDashboard      from './pages/judge/JudgeDashboard';
import JudgeEventListPage  from './pages/judge/EventListPage';
import JudgeOnboardingPage from './pages/judge/JudgeOnboardingPage';
import AssignTeamsPage from './pages/coordinator/AssignTeamsPage';

import MyAssignmentsPage  from './pages/judge/MyAssignmentsPage';
import EvaluateTeamPage   from './pages/judge/EvaluateTeamPage';
import ResultsPage        from './pages/coordinator/ResultsPage';
import ProfilePage        from './pages/ProfilePage';

const App = () => {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    getMeApi()
      .then((res) => {
        const user = unwrapApiData(res);
        if (user) useAuthStore.getState().setUser(user);
      })
      .catch(() => useAuthStore.getState().logout());
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Coordinator */}
        <Route path="/coordinator/dashboard" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <CoordinatorDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/coordinator/events/create" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <CreateEventPage />
          </ProtectedRoute>
        }/>
        <Route path="/coordinator/events/:eventId/registrations" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <ViewRegistrationsPage />
          </ProtectedRoute>
        }/>
        <Route path="/coordinator/events/:eventId/assign" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <AssignTeamsPage />
          </ProtectedRoute>
        }/>        

        {/* Participant */}
        <Route path="/participant/dashboard" element={
          <ProtectedRoute allowedRoles={['participant']}>
            <ParticipantDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/participant/events/:eventId/register" element={
          <ProtectedRoute allowedRoles={['participant']}>
            <RegisterTeamPage />
          </ProtectedRoute>
        }/>
        <Route path="/participant/my-registrations" element={
          <ProtectedRoute allowedRoles={['participant']}>
            <MyRegistrationsPage />
          </ProtectedRoute>
        }/>

        {/* Judge */}
        <Route path="/judge/dashboard" element={
          <ProtectedRoute allowedRoles={['judge']}>
            <JudgeDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/judge/events" element={
          <ProtectedRoute allowedRoles={['judge']}>
            <JudgeEventListPage />
          </ProtectedRoute>
        }/>
        <Route path="/judge/events/:eventId/onboard" element={
          <ProtectedRoute allowedRoles={['judge']}>
            <JudgeOnboardingPage />
          </ProtectedRoute>
        }/>

        {/* Judge — evaluation */}
        <Route path="/judge/events/:eventId/assignments" element={
          <ProtectedRoute allowedRoles={['judge']}>
            <MyAssignmentsPage />
          </ProtectedRoute>
        }/>
        <Route path="/judge/events/:eventId/assignments/:assignmentId/evaluate" element={
          <ProtectedRoute allowedRoles={['judge']}>
            <EvaluateTeamPage />
          </ProtectedRoute>
        }/>
        

        {/* Coordinator — results */}
        <Route path="/coordinator/events/:eventId/results" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <ResultsPage />
          </ProtectedRoute>
        }/>

        {/* Shared profile */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['coordinator', 'participant', 'judge']}>
            <ProfilePage />
          </ProtectedRoute>
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;