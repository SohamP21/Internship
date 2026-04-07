import { create } from 'zustand';

const getInitialTheme = () => {
  const saved = localStorage.getItem('eventify_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark'; // default to dark
};

const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('eventify_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),
  setTheme: (theme) => {
    localStorage.setItem('eventify_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));

export default useThemeStore;
