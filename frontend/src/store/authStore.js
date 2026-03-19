import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user:  null,
  token: localStorage.getItem('eventify_token') || null,

  setAuth: ({ user, token }) => {
    localStorage.setItem('eventify_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('eventify_token');
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;