// src/components/Tree/LevelUpAnimation.jsx
// 레벨업 시 축하 애니메이션

import { useEffect } from 'react';
import { TREE_LEVELS, COLORS } from '../../utils/constants';

// CSS 애니메이션을 위한 스타일 태그 삽입
const injectStyles = () => {
  const styleId = 'levelup-animation-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes levelup-bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    @keyframes levelup-glow {
      0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 197, 0, 0.5)); }
      50% { filter: drop-shadow(0 0 30px rgba(255, 197, 0, 0.9)); }
    }

    @keyframes levelup-fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes levelup-particle {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(var(--tx), var(--ty)) scale(0);
      }
    }

    @keyframes levelup-confetti {
      0% {
        opacity: 1;
        transform: translateY(0) rotate(0deg);
      }
      100% {
        opacity: 0;
        transform: translateY(300px) rotate(720deg);
      }
    }

    @keyframes levelup-text-shine {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
  `;
  document.head.appendChild(style);
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'levelup-fadeIn 0.3s ease',
  },
  content: {
    textAlign: 'center',
    animation: 'levelup-bounce 0.6s ease infinite',
  },
  emoji: {
    fontSize: '8rem',
    animation: 'levelup-glow 1s ease infinite',
    marginBottom: '1rem',
  },
  levelText: {
    fontSize: '1.5rem',
    color: COLORS.text,
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    background: `linear-gradient(90deg, ${COLORS.primary}, #fff, ${COLORS.primary})`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'levelup-text-shine 2s linear infinite',
    marginBottom: '1rem',
  },
  levelName: {
    fontSize: '1.25rem',
    color: COLORS.primary,
    marginBottom: '2rem',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    fontSize: '1.5rem',
    animation: 'levelup-particle 1.5s ease-out forwards',
  },
  confetti: {
    position: 'absolute',
    top: '-20px',
    fontSize: '1.5rem',
    animation: 'levelup-confetti 3s ease-out forwards',
  },
};

// 폭죽 파티클 생성
function Particles() {
  const particles = [];
  const emojis = ['✨', '🎉', '🎊', '⭐', '💫', '🌟'];

  // 중앙에서 퍼지는 파티클
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * 360;
    const distance = 150 + Math.random() * 100;
    const tx = Math.cos((angle * Math.PI) / 180) * distance;
    const ty = Math.sin((angle * Math.PI) / 180) * distance;

    particles.push(
      <div
        key={`particle-${i}`}
        style={{
          ...styles.particle,
          left: '50%',
          top: '50%',
          '--tx': `${tx}px`,
          '--ty': `${ty}px`,
          animationDelay: `${Math.random() * 0.5}s`,
        }}
      >
        {emojis[Math.floor(Math.random() * emojis.length)]}
      </div>
    );
  }

  // 위에서 떨어지는 confetti
  const confettiEmojis = ['🎊', '🎉', '✨', '🌟', '💫'];
  for (let i = 0; i < 15; i++) {
    particles.push(
      <div
        key={`confetti-${i}`}
        style={{
          ...styles.confetti,
          left: `${5 + Math.random() * 90}%`,
          animationDelay: `${Math.random() * 1}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        }}
      >
        {confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]}
      </div>
    );
  }

  return <div style={styles.particlesContainer}>{particles}</div>;
}

export default function LevelUpAnimation({ show, newLevel, onComplete }) {
  useEffect(() => {
    if (show) {
      injectStyles();

      // 3초 후 자동 닫힘
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const levelInfo = TREE_LEVELS.find(l => l.level === newLevel) || TREE_LEVELS[0];

  return (
    <div style={styles.overlay} onClick={onComplete}>
      <Particles />

      <div style={styles.content}>
        <div style={styles.emoji}>{levelInfo.emoji}</div>
        <div style={styles.levelText}>Level {newLevel}</div>
        <div style={styles.title}>레벨 UP!</div>
        <div style={styles.levelName}>{levelInfo.name}</div>
      </div>
    </div>
  );
}
