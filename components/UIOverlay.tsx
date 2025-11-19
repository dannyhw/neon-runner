
import React from 'react';
import { Music } from './Music';
import { GameState } from '../types';

interface UIOverlayProps {
  health: number;
  score: number;
  gameState: GameState;
  onStart: () => void;
  onRestart: () => void;
  onResume: () => void;
  showFps: boolean;
  onToggleFps: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  health, 
  score,
  gameState, 
  onStart, 
  onRestart, 
  onResume,
  showFps,
  onToggleFps,
  musicEnabled,
  onToggleMusic,
  sfxEnabled,
  onToggleSfx
}) => {
  const isPlaying = gameState === GameState.PLAYING;
  const isGameOver = gameState === GameState.GAME_OVER;
  const isPaused = gameState === GameState.PAUSED;
  const isStart = gameState === GameState.START;

  // Color for health bar
  let healthColor = "bg-cyan-500";
  if (health < 60) healthColor = "bg-yellow-500";
  if (health < 30) healthColor = "bg-red-500";

  return (
    <>
      <Music isPlaying={isPlaying && musicEnabled} />

      {/* FPS Counter DOM Element */}
      <div 
        id="fps-display" 
        className={`absolute top-2 left-2 text-xs font-mono text-green-500 z-50 pointer-events-none ${showFps ? 'opacity-100' : 'opacity-0'}`}
      >
        FPS: --
      </div>

      {/* UI Container */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 scanlines font-mono text-cyan-500 select-none z-20">
        
        {/* Top HUD */}
        <div className="flex justify-between items-start">
          <div className="bg-black/60 border border-cyan-500/50 p-4 rounded backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-cyan-400 tracking-widest font-['Orbitron']">SPINNER-99</h1>
            <div className="text-xs text-cyan-700 mt-1">LAPD • SECTOR 4 • UNIT 20-49</div>
            <div className="flex gap-4 mt-2 text-sm">
               <div>VEL: <span className="text-white">{isPaused ? '000' : '380'}</span></div>
               <div>ALT: <span className="text-white animate-pulse">4500</span></div>
            </div>
          </div>

          {/* Score Display */}
           <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 border-x border-cyan-500/30 px-8 py-2 backdrop-blur-sm">
              <div className="text-xs text-cyan-700 text-center tracking-widest mb-1">SCORE</div>
              <div className="text-4xl font-['Orbitron'] text-white tracking-widest">
                {score.toString().padStart(6, '0')}
              </div>
           </div>
          
          <div className="flex flex-col items-end gap-2 w-64">
            <div className="bg-black/60 border border-cyan-500/30 p-3 rounded backdrop-blur-sm w-full">
              <div className="flex justify-between text-sm mb-1">
                <span>HULL INTEGRITY</span>
                <span className={health < 30 ? "text-red-500 animate-pulse" : "text-cyan-400"}>{health}%</span>
              </div>
              <div className="w-full h-2 bg-gray-900 rounded overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${healthColor}`} 
                  style={{ width: `${health}%` }}
                ></div>
              </div>
            </div>
            
            {isGameOver && (
               <div className="text-red-500 bg-black/80 border border-red-500 px-2 py-1 text-xs animate-pulse">
                  CRITICAL FAILURE // SYSTEMS OFFLINE
               </div>
            )}
          </div>
        </div>

        {/* Center Screen Overlays */}
        
        {/* Start Screen */}
        {isStart && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto z-50">
             <button 
               onClick={onStart}
               className="group relative px-12 py-6 bg-transparent border-2 border-cyan-500 text-cyan-500 font-bold tracking-widest hover:bg-cyan-500 hover:text-black transition-all duration-300 mb-12"
             >
               <span className="absolute inset-0 w-full h-full bg-cyan-500/20 opacity-0 group-hover:opacity-100 blur transition-opacity"></span>
               INITIALIZE SYSTEMS
             </button>

             {/* Controls Visualizer */}
             <div className="grid grid-cols-3 gap-12 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-24 border-2 border-cyan-500/50 rounded-full relative flex justify-center pt-2">
                       <div className="w-1 h-6 bg-cyan-500/50 rounded-full animate-pulse"></div>
                    </div>
                    <span className="text-sm tracking-widest text-cyan-300">STEER</span>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-24 border-2 border-cyan-500/50 rounded-t-full rounded-b-lg relative overflow-hidden bg-cyan-900/20">
                       <div className="absolute top-0 left-0 w-1/2 h-10 border-r-2 border-b-2 border-cyan-500 bg-cyan-500/30"></div>
                    </div>
                    <span className="text-sm tracking-widest text-cyan-300">SHOOT</span>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <div className="h-16 flex items-center">
                      <div className="px-4 py-2 border-2 border-cyan-500/50 rounded text-lg font-bold text-cyan-500/80 min-w-[80px]">
                        SHIFT
                      </div>
                    </div>
                    <span className="text-sm tracking-widest text-cyan-300">BOOST</span>
                </div>
             </div>
          </div>
        )}

        {/* Pause Screen */}
        {isPaused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto z-50">
             <h2 className="text-4xl font-['Orbitron'] text-cyan-500 mb-8 tracking-widest">SYSTEM PAUSED</h2>
             
             <div className="flex flex-col gap-4 min-w-[250px]">
                <button 
                  onClick={onResume}
                  className="px-6 py-3 border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-colors font-bold"
                >
                  RESUME
                </button>

                {/* Music Toggle */}
                <button 
                  onClick={onToggleMusic}
                  className="px-6 py-3 border border-cyan-500/30 text-cyan-500/80 hover:bg-cyan-900/30 hover:text-cyan-300 transition-colors flex justify-between"
                >
                  <span>MUSIC</span>
                  <span>[{musicEnabled ? 'ON' : 'OFF'}]</span>
                </button>

                {/* SFX Toggle */}
                <button 
                  onClick={onToggleSfx}
                  className="px-6 py-3 border border-cyan-500/30 text-cyan-500/80 hover:bg-cyan-900/30 hover:text-cyan-300 transition-colors flex justify-between"
                >
                  <span>SFX</span>
                  <span>[{sfxEnabled ? 'ON' : 'OFF'}]</span>
                </button>
                
                <button 
                  onClick={onToggleFps}
                  className="px-6 py-3 border border-cyan-500/30 text-cyan-500/80 hover:bg-cyan-900/30 hover:text-cyan-300 transition-colors flex justify-between"
                >
                  <span>FPS COUNTER</span>
                  <span>[{showFps ? 'ON' : 'OFF'}]</span>
                </button>
             </div>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-sm pointer-events-auto z-50">
              <h2 className="text-6xl font-['Orbitron'] text-red-500 mb-4 tracking-tighter animate-pulse">TERMINATED</h2>
              <div className="text-red-400 mb-4 font-mono">VEHICLE DESTROYED</div>
              <div className="text-2xl text-white mb-8 font-['Orbitron']">SCORE: {score}</div>
              
              <button 
                 onClick={onRestart}
                 className="px-6 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-colors"
              >
                 REBOOT SYSTEM
              </button>
           </div>
        )}
        
        {/* Damage Flash Effect */}
        <div className={`absolute inset-0 bg-red-500/30 pointer-events-none transition-opacity duration-100 ${health < 100 && (health % 20 === 0) ? 'opacity-0' : 'opacity-0'}`} />


        {/* Bottom HUD */}
        <div className="flex justify-between items-end">
           <div className="text-xs text-cyan-800 bg-black/20 p-2 rounded">
              LOCATION: SECTOR 7<br/>
              WEATHER: HEAVY ACID RAIN<br/>
              THREAT: ACTIVE MINES DETECTED
           </div>
           
           <div className="text-right p-4 opacity-70">
             <div className="text-[10px] text-cyan-800">SYSTEM DIAGNOSTICS</div>
             <div className="grid grid-cols-4 gap-1 w-32 ml-auto mt-1">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`h-1 ${Math.random() > (health/100) ? 'bg-red-900' : 'bg-cyan-500'} transition-colors duration-500`}></div>
                ))}
             </div>
           </div>
        </div>

      </div>
    </>
  );
};
