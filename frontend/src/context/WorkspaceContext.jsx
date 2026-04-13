import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getOpsSummaryApi } from '../api/eventApi';
import { unwrapApiData } from '../api/authApi';

const WorkspaceContext = createContext(null);

const storageKey = (role) => `eventify_workspace_event_${role}`;

export function WorkspaceProvider({ children }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [activeEventId, setActiveEventIdState] = useState(null);
  const [opsSummary, setOpsSummary] = useState(null);
  const [opsLoading, setOpsLoading] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'coordinator' && user.role !== 'judge')) {
      setActiveEventIdState(null);
      return;
    }
    const stored = localStorage.getItem(storageKey(user.role));
    setActiveEventIdState(stored || null);
  }, [user?._id, user?.role]);

  const setActiveEventId = useCallback((id) => {
    const next = id ? String(id) : null;
    setActiveEventIdState(next);
    const role = useAuthStore.getState().user?.role;
    if (role === 'coordinator' || role === 'judge') {
      const k = storageKey(role);
      if (next) localStorage.setItem(k, next);
      else localStorage.removeItem(k);
    }
  }, []);

  const refreshOps = useCallback(async () => {
    const u = useAuthStore.getState().user;
    const t = useAuthStore.getState().token;
    if (!t || !u) return;
    setOpsLoading(true);
    try {
      const ev =
        u.role === 'participant' ? undefined : activeEventId || undefined;
      const res = await getOpsSummaryApi(ev);
      setOpsSummary(unwrapApiData(res));
    } catch {
      setOpsSummary(null);
    } finally {
      setOpsLoading(false);
    }
  }, [activeEventId]);

  useEffect(() => {
    if (!token || !user) {
      setOpsSummary(null);
      return;
    }
    refreshOps();
  }, [token, user?._id, user?.role, activeEventId, refreshOps]);

  useEffect(() => {
    if (!opsSummary?.events?.length || !activeEventId) return;
    const ok = opsSummary.events.some(
      (e) => String(e._id) === String(activeEventId)
    );
    if (!ok) setActiveEventId(null);
  }, [opsSummary, activeEventId, setActiveEventId]);

  useEffect(() => {
    if (!user || (user.role !== 'coordinator' && user.role !== 'judge')) return;
    const m = location.pathname.match(
      /\/(?:coordinator|judge)\/events\/([a-fA-F0-9]{24})\//
    );
    if (m?.[1]) setActiveEventId(m[1]);
  }, [location.pathname, user?.role, setActiveEventId]);

  const value = useMemo(
    () => ({
      activeEventId,
      setActiveEventId,
      opsSummary,
      opsLoading,
      refreshOps,
    }),
    [activeEventId, setActiveEventId, opsSummary, opsLoading, refreshOps]
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    return {
      activeEventId: null,
      setActiveEventId: () => {},
      opsSummary: null,
      opsLoading: false,
      refreshOps: async () => {},
    };
  }
  return ctx;
}
