import { useCallback } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const options = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    color: { value: '#ffffff' },
    links: { enable: true, color: '#ffffff', distance: 110, opacity: 0.12, width: 0.5 },
    move: { enable: true, speed: 0.6 },
    number: { value: 48, density: { enable: true } },
    opacity: { value: { min: 0.08, max: 0.35 } },
    size: { value: { min: 1, max: 2 } },
  },
  detectRetina: true,
};

export default function AuthParticles({ className = '' }) {
  const init = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      className={className}
      id="auth-particles"
      init={init}
      options={options}
    />
  );
}
