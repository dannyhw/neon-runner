import React, { useState, useCallback, useEffect } from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import { GameState } from './types';

function App() {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [showFps, setShowFps] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const handleStart = () => {
    setGameState(GameState.PLAYING);
    setHealth(100);
    setScore(0);
  };

  const handleRestart = () => {
    setGameState(GameState.PLAYING);
    setHealth(100);
    setScore(0);
  };

  const handleResume = () => {
    setGameState(GameState.PLAYING);
  };

  const toggleFps = () => {
    setShowFps(prev => !prev);
  };

  const toggleMusic = () => {
    setMusicEnabled(prev => !prev);
  };

  const toggleSfx = () => {
    setSfxEnabled(prev => !prev);
  };

  // Score Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === GameState.PLAYING) {
      interval = setInterval(() => {
        setScore(prev => prev + 100);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Pause Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === GameState.PLAYING) {
          setGameState(GameState.PAUSED);
        } else if (gameState === GameState.PAUSED) {
          setGameState(GameState.PLAYING);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const handleDamage = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    
    setHealth((prev) => {
      const newHealth = prev - 20;
      if (newHealth <= 0) {
        setGameState(GameState.GAME_OVER);
        return 0;
      }
      return newHealth;
    });
  }, [gameState]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <Scene 
        gameActive={gameState === GameState.PLAYING} 
        onDamage={handleDamage} 
        score={score}
        sfxEnabled={sfxEnabled}
      />
      <UIOverlay 
        health={health} 
        score={score}
        gameState={gameState}
        onStart={handleStart}
        onRestart={handleRestart}
        onResume={handleResume}
        showFps={showFps}
        onToggleFps={toggleFps}
        musicEnabled={musicEnabled}
        onToggleMusic={toggleMusic}
        sfxEnabled={sfxEnabled}
        onToggleSfx={toggleSfx}
      />
    </div>
  );
}

export default App;