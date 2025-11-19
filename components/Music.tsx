
import React, { useEffect, useRef } from 'react';

interface MusicProps {
  isPlaying: boolean;
}

export const Music: React.FC<MusicProps> = ({ isPlaying }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicUrl = "https://cdn.pixabay.com/download/audio/2024/09/17/audio_4b8d36dc02.mp3?filename=neon-nights-241523.mp3";

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio playback prevented:", error);
        });
      }
    } else {
      audioRef.current.pause();
      // Optional: Reset to beginning on stop if desired, but pause is usually better for game states
      // audioRef.current.currentTime = 0; 
    }
  }, [isPlaying]);

  return (
    <audio 
      ref={audioRef} 
      src={musicUrl} 
      loop 
      preload="auto"
      style={{ display: 'none' }}
    />
  );
};
