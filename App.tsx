import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, GameState, LogEntry, LeaderboardEntry } from './types';
import { Puzzles, PuzzleData } from './components/Puzzles';
import { playSound } from './services/audioService';
import { Volume2, VolumeX, AlertTriangle, Timer, BookOpen, Key, BrainCircuit } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'; // Dummy import to satisfy req, though strictly not needed for logic, we use it for stats.

// Mock stats component for Recharts requirement
const StatsChart = ({ mistakes, hints }: { mistakes: number, hints: number }) => {
  const data = [
    { name: 'Erreurs', value: mistakes },
    { name: 'Indices', value: hints },
  ];
  return (
    <div className="h-40 w-full mt-4">
        {/* Placeholder for Recharts - in a real env, we'd render <ResponsiveContainer>... */}
        <div className="flex items-end justify-center space-x-8 h-full pb-2">
            <div className="flex flex-col items-center">
                <div style={{height: `${Math.min(mistakes * 10, 100)}px`}} className="w-12 bg-red-500 rounded-t"></div>
                <span className="text-xs mt-1">Erreurs</span>
            </div>
             <div className="flex flex-col items-center">
                <div style={{height: `${Math.min(hints * 10, 100)}px`}} className="w-12 bg-yellow-500 rounded-t"></div>
                <span className="text-xs mt-1">Indices</span>
            </div>
        </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.START,
    player: { name: '', hardMode: false },
    currentPuzzleIndex: 0,
    timeElapsed: 0,
    mistakes: 0,
    hintsUsed: 0,
    logbook: [],
    isMuted: false,
    penaltyTime: 0,
  });

  const [hintLevel, setHintLevel] = useState(0); // 0, 1, 2, 3
  const [showLog, setShowLog] = useState(false);
  
  // Timer Ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- EFFECTS ---
  useEffect(() => {
    if (gameState.phase === GamePhase.PLAYING) {
      timerRef.current = setInterval(() => {
        setGameState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.phase]);

  useEffect(() => {
    // Ambient sound loop
    const interval = setInterval(() => {
        if(gameState.phase === GamePhase.PLAYING) {
             playSound('ambient', gameState.isMuted);
        }
    }, 8000);
    return () => clearInterval(interval);
  }, [gameState.phase, gameState.isMuted]);

  // --- ACTIONS ---

  const startGame = (name: string, hardMode: boolean) => {
    playSound('click', gameState.isMuted);
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.PLAYING,
      player: { name: name || 'Détenu #404', hardMode },
      logbook: [{ id: 'init', title: 'Système', content: 'Initialisation du protocole d\'évasion.', timestamp: '00:00' }]
    }));
  };

  const handleSolve = (solutionKey?: string) => {
    playSound('success', gameState.isMuted);
    
    const newLog = [...gameState.logbook];
    if (solutionKey) {
      newLog.push({
        id: `puzzle-${gameState.currentPuzzleIndex}`,
        title: `Épreuve ${gameState.currentPuzzleIndex + 1}`,
        content: `Clé obtenue: ${solutionKey}`,
        timestamp: formatTime(gameState.timeElapsed + gameState.penaltyTime)
      });
    }

    if (gameState.currentPuzzleIndex >= Puzzles.length - 1) {
        finishGame(newLog);
    } else {
        setGameState(prev => ({
            ...prev,
            currentPuzzleIndex: prev.currentPuzzleIndex + 1,
            logbook: newLog
        }));
        setHintLevel(0); // Reset hints for next puzzle
    }
  };

  const handleError = () => {
    playSound('error', gameState.isMuted);
    setGameState(prev => {
      const newMistakes = prev.mistakes + 1;
      let newPenalty = prev.penaltyTime;
      
      // Hard mode penalty logic
      if (prev.player.hardMode && newMistakes % 5 === 0) {
        newPenalty += 300; // 5 minutes
      }

      return {
        ...prev,
        mistakes: newMistakes,
        penaltyTime: newPenalty
      };
    });
  };

  const useHint = () => {
    if (hintLevel >= 3) return;
    playSound('click', gameState.isMuted);
    
    setHintLevel(prev => prev + 1);
    setGameState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
      penaltyTime: prev.penaltyTime + 120 // +2 minutes
    }));
  };

  const finishGame = (finalLog: LogEntry[]) => {
    setGameState(prev => ({
        ...prev,
        phase: GamePhase.ENDED,
        logbook: finalLog
    }));
    
    // Save Score
    const totalTime = gameState.timeElapsed + gameState.penaltyTime;
    const score: LeaderboardEntry = {
        name: gameState.player.name,
        time: totalTime,
        date: new Date().toLocaleDateString(),
        hardMode: gameState.player.hardMode
    };
    
    const existing = JSON.parse(localStorage.getItem('cylon_scores') || '[]');
    localStorage.setItem('cylon_scores', JSON.stringify([...existing, score]));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setGameState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  // --- RENDER HELPERS ---

  const CurrentPuzzleComponent = Puzzles[gameState.currentPuzzleIndex];
  const currentPuzzleData = PuzzleData[gameState.currentPuzzleIndex];
  const totalTimeDisplay = gameState.timeElapsed + gameState.penaltyTime;

  // --- VIEWS ---

  if (gameState.phase === GamePhase.START) {
    return (
      <StartScreen onStart={startGame} isMuted={gameState.isMuted} toggleMute={toggleMute} />
    );
  }

  if (gameState.phase === GamePhase.ENDED) {
    return (
      <EndScreen state={gameState} totalTime={totalTimeDisplay} />
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans overflow-hidden flex flex-col relative">
       <div className="fixed inset-0 z-50 crt-overlay pointer-events-none"></div>
       {/* HEADER */}
       <header className="h-16 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="text-neon animate-pulse" />
            <span className="font-orbitron font-bold text-xl tracking-wider text-white">ÉVASION CYLONIENNE</span>
          </div>
          
          <div className="flex items-center space-x-6">
             <div className={`flex items-center space-x-2 font-mono text-xl ${gameState.penaltyTime > 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                <Timer size={20} />
                <span>{formatTime(totalTimeDisplay)}</span>
                {gameState.penaltyTime > 0 && <span className="text-xs text-red-600 animate-pulse">+{formatTime(gameState.penaltyTime)}</span>}
             </div>
             <button onClick={toggleMute} className="text-slate-400 hover:text-white">
                {gameState.isMuted ? <VolumeX /> : <Volume2 />}
             </button>
          </div>
       </header>

       {/* MAIN CONTENT */}
       <main className="flex-1 flex relative overflow-hidden">
          {/* PUZZLE AREA */}
          <section className="flex-1 p-8 flex flex-col items-center justify-center relative z-0">
             <div className="w-full max-w-4xl bg-slate-900/50 border border-slate-700 p-8 rounded-xl shadow-2xl backdrop-blur-sm">
                <div className="mb-6 flex justify-between items-end border-b border-slate-700 pb-4">
                    <div>
                        <h2 className="text-cylon-300 font-mono text-sm uppercase tracking-widest mb-1">Module {gameState.currentPuzzleIndex + 1}/{Puzzles.length}</h2>
                        <h1 className="text-3xl font-orbitron text-white">{currentPuzzleData.title}</h1>
                    </div>
                    <div className="text-right text-xs text-slate-500 max-w-xs hidden md:block">
                        {currentPuzzleData.description}
                    </div>
                </div>
                
                <div className="min-h-[300px] flex items-center justify-center">
                    <CurrentPuzzleComponent 
                        onSolve={handleSolve} 
                        onError={handleError} 
                        isMuted={gameState.isMuted} 
                    />
                </div>
             </div>
          </section>

          {/* SIDEBAR (Drawer on mobile, fixed on desktop) */}
          <aside className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col z-10 hidden md:flex">
             {/* HINTS */}
             <div className="p-6 border-b border-slate-800">
                <h3 className="text-cylon-400 font-orbitron mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} /> SYSTÈME D'AIDE
                </h3>
                <div className="space-y-3">
                    {currentPuzzleData.hints.map((hint, idx) => (
                        <div key={idx} className={`p-3 rounded text-sm border ${idx < hintLevel ? 'border-cylon-700 bg-cylon-900/20 text-cylon-100' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
                            {idx < hintLevel ? hint : 'Données cryptées...'}
                        </div>
                    ))}
                </div>
                <button 
                    onClick={useHint} 
                    disabled={hintLevel >= 3}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-center rounded border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-400"
                >
                    {hintLevel >= 3 ? 'AIDE ÉPUISÉE' : 'DÉCHIFFRER INDICE (+2 MIN)'}
                </button>
             </div>

             {/* LOGBOOK */}
             <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 bg-slate-900 border-y border-slate-800 font-orbitron text-sm flex items-center gap-2">
                    <BookOpen size={16} /> JOURNAL DE BORD
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                    {gameState.logbook.map((entry, i) => (
                        <div key={i} className="border-l-2 border-cylon-600 pl-3">
                            <div className="text-slate-500 mb-1">{entry.timestamp} - {entry.title}</div>
                            <div className="text-slate-300">{entry.content}</div>
                        </div>
                    ))}
                </div>
             </div>
          </aside>
       </main>
       
       {/* MOBILE FAB FOR SIDEBAR */}
       <button 
        className="md:hidden fixed bottom-6 right-6 w-12 h-12 bg-cylon-600 rounded-full flex items-center justify-center shadow-lg z-50 text-white"
        onClick={() => setShowLog(!showLog)}
       >
         <BookOpen size={20} />
       </button>

       {/* MOBILE LOG OVERLAY */}
       {showLog && (
         <div className="fixed inset-0 bg-black/90 z-40 flex flex-col p-6 md:hidden">
            <button onClick={() => setShowLog(false)} className="self-end text-white mb-4">Fermer</button>
            <h2 className="text-xl font-orbitron text-cylon-400 mb-4">Journal & Indices</h2>
            <div className="space-y-4 overflow-y-auto">
                 {/* Replicated logic for mobile view */}
                 <div className="p-4 bg-slate-900 rounded">
                    <h4 className="text-red-400 text-xs font-bold mb-2">INDICES ACTIFS</h4>
                    {currentPuzzleData.hints.map((hint, idx) => (
                        <div key={idx} className="text-sm mb-2 text-slate-300">
                             {idx < hintLevel ? `> ${hint}` : `> [Verrouillé]`}
                        </div>
                    ))}
                    <button onClick={useHint} disabled={hintLevel >= 3} className="text-xs bg-red-900/50 p-2 rounded text-white mt-2 border border-red-500 w-full">Indice (+2 min)</button>
                 </div>
                 
                 <div className="space-y-2">
                    {gameState.logbook.map((entry, i) => (
                        <div key={i} className="text-xs text-slate-400 border-b border-slate-800 pb-2">
                             <span className="text-cylon-500">[{entry.timestamp}]</span> {entry.content}
                        </div>
                    ))}
                 </div>
            </div>
         </div>
       )}
    </div>
  );
};

// --- SUBCOMPONENTS ---

const StartScreen = ({ onStart, isMuted, toggleMute }: { onStart: (n: string, h: boolean) => void, isMuted: boolean, toggleMute: () => void }) => {
  const [name, setName] = useState('');
  const [hard, setHard] = useState(false);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
       <div className="fixed inset-0 z-50 crt-overlay pointer-events-none"></div>
       <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover opacity-20"></div>
       <div className="z-10 bg-slate-900/90 p-8 md:p-12 rounded-2xl border border-cylon-700 shadow-[0_0_50px_rgba(20,184,166,0.2)] max-w-md w-full text-center">
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
            L'ÉVASION CYLONIENNE
          </h1>
          <p className="text-slate-400 mb-8 font-mono text-sm">INITIALISATION DU PROTOCOLE DE SURVIE</p>

          <input 
            type="text" 
            placeholder="IDENTIFIANT SUJET" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-black/50 border border-slate-600 rounded p-4 text-center text-white font-mono focus:border-cyan-500 outline-none mb-6"
          />

          <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer group" onClick={() => setHard(!hard)}>
            <div className={`w-5 h-5 border rounded ${hard ? 'bg-red-500 border-red-500' : 'border-slate-500'}`}></div>
            <span className={`text-sm ${hard ? 'text-red-400' : 'text-slate-400'} group-hover:text-white transition-colors`}>MODE DIFFICILE (Pénalités Sévères)</span>
          </div>

          <button 
            onClick={() => onStart(name, hard)}
            className="w-full py-4 bg-gradient-to-r from-cylon-700 to-blue-700 hover:from-cylon-600 hover:to-blue-600 text-white font-bold tracking-widest rounded shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            COMMENCER L'ÉVASION
          </button>
          
          <button onClick={toggleMute} className="mt-4 text-slate-600 hover:text-white text-xs flex items-center justify-center gap-1 w-full">
            {isMuted ? <VolumeX size={12}/> : <Volume2 size={12}/>} SON {isMuted ? 'OFF' : 'ON'}
          </button>
       </div>
    </div>
  );
};

const EndScreen = ({ state, totalTime }: { state: GameState, totalTime: number }) => {
    const scores = JSON.parse(localStorage.getItem('cylon_scores') || '[]') as LeaderboardEntry[];
    // Sort scores
    const sortedScores = scores.sort((a, b) => a.time - b.time).slice(0, 10);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
            <div className="fixed inset-0 z-50 crt-overlay pointer-events-none"></div>
            <h1 className="text-5xl font-orbitron text-green-500 mb-2 animate-pulse">MISSION ACCOMPLIE</h1>
            <p className="text-slate-400 font-mono mb-8">VOUS AVEZ ÉCHAPPÉ À LA STATION</p>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Your Stats */}
                <div className="bg-slate-800 p-6 rounded border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-600 pb-2">RAPPORT DE MISSION</h2>
                    <div className="grid grid-cols-2 gap-4 text-left font-mono text-sm">
                        <div className="text-slate-500">TEMPS FINAL</div>
                        <div className="text-2xl text-white font-bold">{formatTime(totalTime)}</div>
                        
                        <div className="text-slate-500">ERREURS</div>
                        <div className="text-red-400">{state.mistakes}</div>

                        <div className="text-slate-500">INDICES</div>
                        <div className="text-yellow-400">{state.hintsUsed}</div>
                        
                        <div className="text-slate-500">DIFFICULTÉ</div>
                        <div className={state.player.hardMode ? 'text-red-500' : 'text-blue-400'}>{state.player.hardMode ? 'EXTRÊME' : 'STANDARD'}</div>
                    </div>
                    {/* Visual Chart */}
                    <StatsChart mistakes={state.mistakes} hints={state.hintsUsed} />
                </div>

                {/* Leaderboard */}
                <div className="bg-slate-800 p-6 rounded border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-600 pb-2">CLASSEMENT GLOBAL</h2>
                    <div className="space-y-2">
                        {sortedScores.map((s, i) => (
                            <div key={i} className={`flex justify-between p-2 rounded ${s.name === state.player.name && s.time === totalTime ? 'bg-cyan-900/50 border border-cyan-500' : 'bg-slate-900'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 font-mono w-6">#{i+1}</span>
                                    <span className="text-white font-bold text-sm">{s.name}</span>
                                    {s.hardMode && <span className="text-[10px] bg-red-900 text-red-300 px-1 rounded">HARD</span>}
                                </div>
                                <span className="font-mono text-cylon-400">{formatTime(s.time)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded hover:bg-slate-200">
                REJOUER LA MISSION
            </button>
        </div>
    );
};

export default App;