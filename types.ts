export enum GamePhase {
  START = 'START',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED'
}

export interface Player {
  name: string;
  hardMode: boolean;
}

export interface LogEntry {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

export interface GameState {
  phase: GamePhase;
  player: Player;
  currentPuzzleIndex: number;
  timeElapsed: number; // in seconds
  mistakes: number;
  hintsUsed: number;
  logbook: LogEntry[];
  isMuted: boolean;
  penaltyTime: number; // accumulated penalty time
}

export interface PuzzleDefinition {
  id: number;
  title: string;
  description: string;
  hints: string[];
}

export interface LeaderboardEntry {
  name: string;
  time: number;
  date: string;
  hardMode: boolean;
}
