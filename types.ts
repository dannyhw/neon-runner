export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export interface Message {
  id: string;
  sender: 'USER' | 'SYSTEM' | 'AI';
  text: string;
  timestamp: number;
}

export interface SpinnerState {
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
}

export interface LaserData {
  position: any; // THREE.Vector3
  active: boolean;
}