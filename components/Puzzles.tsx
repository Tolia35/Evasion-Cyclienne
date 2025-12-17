import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Terminal, Zap, Lock, Eye, Music, Cpu, Database, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { playSound } from '../services/audioService';

interface PuzzleProps {
  onSolve: (data?: string) => void;
  onError: (error?: string) => void;
  isMuted: boolean;
}

// --- PUZZLE 1: MATRIX GRID ---
export const Puzzle1Numeric: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  const [grid, setGrid] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  // Code is sum of prime numbers in the grid
  
  useEffect(() => {
    // Generate random numbers
    const newGrid = Array.from({ length: 16 }, () => Math.floor(Math.random() * 20) + 1);
    // Ensure at least 3 primes
    newGrid[0] = 3; newGrid[5] = 7; newGrid[10] = 5;
    setGrid(newGrid);
  }, []);

  const isPrime = (num: number) => {
    for(let i = 2; i < num; i++) if(num % i === 0) return false;
    return num > 1;
  };

  const handleSelect = (num: number, idx: number) => {
    playSound('click', isMuted);
    if (selected.includes(idx)) {
      setSelected(prev => prev.filter(i => i !== idx));
    } else {
      setSelected(prev => [...prev, idx]);
    }
  };

  const validate = () => {
    // Correct solution: All selected numbers must be prime, and ALL prime numbers in grid must be selected
    const allPrimesIndices = grid.map((n, i) => isPrime(n) ? i : -1).filter(i => i !== -1);
    const selectedSorted = [...selected].sort();
    const allPrimesSorted = [...allPrimesIndices].sort();

    if (JSON.stringify(selectedSorted) === JSON.stringify(allPrimesSorted)) {
      onSolve("CODE-ALPHA");
    } else {
      onError("Sequence Invalid");
      setSelected([]);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-cyan-400 font-mono mb-2">SÉCURITÉ: <span className="text-white">DÉSACTIVER LES NOMBRES PREMIERS</span></div>
      <div className="grid grid-cols-4 gap-3">
        {grid.map((num, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(num, idx)}
            className={`w-16 h-16 border-2 font-orbitron text-xl transition-all duration-300 ${
              selected.includes(idx) 
                ? 'border-neon bg-cyan-900/50 text-white shadow-[0_0_15px_#00ffea]' 
                : 'border-slate-700 text-slate-500 hover:border-cyan-700'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <button onClick={validate} className="mt-4 px-6 py-2 bg-cylon-600 hover:bg-cylon-500 text-white font-bold rounded shadow-lg uppercase tracking-widest">
        Valider Séquence
      </button>
    </div>
  );
};

// --- PUZZLE 2: VISUAL SEQUENCE ---
export const Puzzle2Sequence: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  const sequenceLength = 5;
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlighted, setHighlighted] = useState<number | null>(null);

  useEffect(() => {
    const seq = Array.from({ length: sequenceLength }, () => Math.floor(Math.random() * 4));
    setSequence(seq);
  }, []);

  const playSequence = async () => {
    setIsPlaying(true);
    setUserSequence([]);
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, 500));
      setHighlighted(sequence[i]);
      playSound('hover', isMuted);
      await new Promise(r => setTimeout(r, 500));
      setHighlighted(null);
    }
    setIsPlaying(false);
  };

  const handleBtnClick = (idx: number) => {
    if (isPlaying) return;
    playSound('click', isMuted);
    const newSeq = [...userSequence, idx];
    setUserSequence(newSeq);

    // Check immediately
    if (newSeq[newSeq.length - 1] !== sequence[newSeq.length - 1]) {
      onError("Incorrect Sequence");
      setUserSequence([]);
      return;
    }

    if (newSeq.length === sequenceLength) {
      onSolve("CODE-BETA");
    }
  };

  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
  const glow = ['shadow-red-500', 'shadow-blue-500', 'shadow-green-500', 'shadow-yellow-500'];

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-cyan-300 font-mono">MÉMORISER LE SCHÉMA</div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[0, 1, 2, 3].map((idx) => (
          <button
            key={idx}
            onClick={() => handleBtnClick(idx)}
            className={`w-24 h-24 rounded-lg border border-slate-600 transition-all duration-200 ${
              highlighted === idx ? `${colors[idx]} shadow-[0_0_25px] ${glow[idx]} scale-105` : 'bg-slate-800 opacity-60 hover:opacity-100'
            }`}
          />
        ))}
      </div>
      <button 
        onClick={playSequence} 
        disabled={isPlaying}
        className="flex items-center gap-2 px-4 py-2 border border-cyan-500 text-cyan-400 hover:bg-cyan-950 disabled:opacity-50"
      >
        <Play size={16} /> {isPlaying ? 'Transmission...' : 'Lire la Séquence'}
      </button>
    </div>
  );
};

// --- PUZZLE 3: ROTATING PIPES ---
export const Puzzle3Circuit: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  // Simple 2x2 grid for brevity, but represented as rotation states (0, 1, 2, 3) * 90deg
  const [rotations, setRotations] = useState([1, 2, 0, 3]); 
  // Solution could be all 0 (aligned horizontally)
  
  const rotate = (idx: number) => {
    playSound('click', isMuted);
    const newRot = [...rotations];
    newRot[idx] = (newRot[idx] + 1) % 4;
    setRotations(newRot);
  };

  const checkCircuit = () => {
    // Solution: Line is horizontal. So idx 0 and 1 must be horizontal (0 or 2), 
    // idx 2 and 3 must be horizontal (0 or 2)
    // Actually let's make it specific: All must be 0 (Horizontal Bar)
    if (rotations.every(r => r === 0)) {
      onSolve("FLUX-STABLE");
    } else {
      onError("Circuit Unstable");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-cyan-300 font-mono">RÉTABLIR LE FLUX D'ÉNERGIE (ALIGNEMENT HORIZONTAL)</div>
      <div className="grid grid-cols-2 w-64 h-64 border border-slate-700 bg-black">
        {rotations.map((r, i) => (
          <div key={i} onClick={() => rotate(i)} className="border border-slate-800 cursor-pointer relative flex items-center justify-center overflow-hidden hover:bg-slate-900">
            <div 
              className="w-full h-4 bg-gradient-to-r from-cyan-900 to-cyan-500 shadow-[0_0_10px_#00ffea]"
              style={{ transform: `rotate(${r * 90}deg)`, transition: 'transform 0.3s' }}
            >
              <div className="w-full h-full bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={checkCircuit} className="mt-6 px-6 py-2 bg-cylon-600 hover:bg-cylon-500 text-white rounded font-bold">
        Initialiser Flux
      </button>
    </div>
  );
};

// --- PUZZLE 4: CONSOLE ---
export const Puzzle4Console: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['Connexion établie...', 'Système verrouillé.']);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click', isMuted);
    const cmd = input.trim().toLowerCase();
    const newHistory = [...history, `> ${input}`];

    if (cmd === 'help') {
      newHistory.push('Commandes disponibles: help, ls, cat [fichier], unlock');
    } else if (cmd === 'ls') {
      newHistory.push('fichiers: system.log, password.txt, config.sys');
    } else if (cmd === 'cat password.txt') {
      newHistory.push('Erreur: Fichier corrompu. Indice partiel: "GAMMA"');
    } else if (cmd === 'cat system.log') {
      newHistory.push('[LOG] Tentative de brèche détectée.');
    } else if (cmd === 'unlock gamma') {
       onSolve("GAMMA-KEY");
       return; // Stop here
    } else if (cmd.startsWith('unlock')) {
      newHistory.push('Accès refusé. Mot de passe incorrect.');
      onError("Access Denied");
    } else {
      newHistory.push('Commande inconnue.');
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div className="w-full max-w-lg bg-black border border-slate-600 p-4 rounded font-mono text-sm h-80 flex flex-col shadow-inner">
      <div className="flex-1 overflow-y-auto space-y-1 text-green-500">
        {history.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleCommand} className="mt-2 flex border-t border-slate-700 pt-2">
        <span className="text-green-500 mr-2">$</span>
        <input 
          autoFocus
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-transparent border-none outline-none text-green-400 flex-1"
          placeholder="Entrez une commande..."
        />
      </form>
    </div>
  );
};

// --- PUZZLE 5: LOGIC ---
export const Puzzle5Logic: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  const [answer, setAnswer] = useState('');

  const checkAnswer = () => {
    playSound('click', isMuted);
    if (answer.toLowerCase().includes('mars')) {
      onSolve("PLANET-RED");
    } else {
      onError("Incorrect Answer");
    }
  };

  return (
    <div className="max-w-md text-center">
      <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 mb-4 text-left font-mono text-cyan-200">
        <p className="mb-2">"Je suis rouge, mais pas de colère."</p>
        <p className="mb-2">"J'ai des calottes glaciaires, mais je ne suis pas la Terre."</p>
        <p>"Les dieux de la guerre portent mon nom."</p>
        <p className="mt-4 text-white font-bold">Où se trouve la base secrète ?</p>
      </div>
      <input 
        type="text" 
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        className="w-full bg-slate-800 border border-cyan-700 p-3 text-white rounded mb-4 focus:outline-none focus:border-neon"
        placeholder="Réponse..."
      />
      <button onClick={checkAnswer} className="px-6 py-2 bg-cylon-700 hover:bg-cylon-600 rounded text-white font-bold">
        Soumettre
      </button>
    </div>
  );
};

// --- PUZZLE 6: FREQUENCY ---
export const Puzzle6Frequency: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  const [freq, setFreq] = useState(50);
  const target = 82; // Random target

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFreq(Number(e.target.value));
  };

  const validate = () => {
    playSound('click', isMuted);
    if (Math.abs(freq - target) < 5) {
      onSolve("WAVE-SYNC");
    } else {
      onError("Signal Unstable");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-cyan-300 font-mono mb-4 text-center">SYNCHRONISER LA FRÉQUENCE D'ONDE</div>
      
      {/* Visualizer */}
      <div className="h-32 bg-black border border-slate-600 rounded mb-6 flex items-center justify-center relative overflow-hidden">
        <svg className="absolute w-full h-full" preserveAspectRatio="none">
          <path 
            d={`M 0 64 Q 50 ${64 - (freq/2)} 100 64 T 200 64 T 300 64 T 400 64`} 
            fill="none" 
            stroke={Math.abs(freq - target) < 5 ? "#00ffea" : "#ef4444"} 
            strokeWidth="3"
            className="transition-all duration-300"
          />
          {/* Target Ghost */}
          <path 
             d={`M 0 64 Q 50 ${64 - (target/2)} 100 64 T 200 64 T 300 64 T 400 64`} 
             fill="none" 
             stroke="rgba(255,255,255,0.2)" 
             strokeWidth="2"
             strokeDasharray="5,5"
          />
        </svg>
      </div>

      <input 
        type="range" 
        min="0" 
        max="100" 
        value={freq} 
        onChange={handleChange}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
      <div className="flex justify-between text-xs text-slate-500 font-mono mt-2">
        <span>0 Hz</span>
        <span>{freq} Hz</span>
        <span>100 Hz</span>
      </div>

      <button onClick={validate} className="mt-6 w-full py-3 bg-slate-800 border border-cyan-500 text-cyan-400 hover:bg-cyan-900 font-bold rounded">
        VERROUILLER SIGNAL
      </button>
    </div>
  );
};

// --- PUZZLE 7: MINI GAME (Reaction) ---
export const Puzzle7Reflex: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [active, setActive] = useState(true);
  const reqRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      if (!active) return;
      setPosition(prev => {
        if (prev >= 95) setDirection(-1);
        if (prev <= 0) setDirection(1);
        return prev + (direction * 1.5); // Speed
      });
      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [direction, active]);

  const stop = () => {
    playSound('click', isMuted);
    setActive(false);
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    
    // Target zone is roughly 40-60
    if (position >= 40 && position <= 60) {
      onSolve("REFLEX-OK");
    } else {
      onError("Reflex Check Failed");
      setTimeout(() => setActive(true), 1000); // Reset after 1s
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="text-center font-mono text-cyan-300 mb-4">ARRÊTER LE CURSEUR DANS LA ZONE DE STABILITÉ</div>
      <div className="h-12 w-full bg-slate-900 border border-slate-600 relative rounded overflow-hidden">
        {/* Safe Zone */}
        <div className="absolute left-[40%] w-[20%] h-full bg-green-900/50 border-x border-green-500/50"></div>
        {/* Cursor */}
        <div 
          className="absolute top-0 w-2 h-full bg-neon shadow-[0_0_10px_#00ffea]"
          style={{ left: `${position}%` }}
        ></div>
      </div>
      <button 
        onClick={stop} 
        disabled={!active}
        className="mt-6 w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xl tracking-widest rounded shadow-lg"
      >
        STOP
      </button>
    </div>
  );
};

// --- PUZZLE 8: DOM MANIPULATION ---
export const Puzzle8DOM: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  const [code, setCode] = useState('');

  const check = () => {
    playSound('click', isMuted);
    if (code.toUpperCase() === 'INSPECTEUR') {
      onSolve("SOURCE-FOUND");
    } else {
      onError("Incorrect Code");
    }
  };

  return (
    <div className="text-center">
      <div className="font-mono text-cyan-200 mb-6">
        <p>Le code n'est pas visible à l'œil nu.</p>
        <p>Parfois, il faut regarder <span className="italic text-slate-500">sous le capot</span>.</p>
      </div>
      
      {/* Hidden element for the user to find via DevTools */}
      <div style={{ display: 'none' }} data-secret-clue="Le code est : INSPECTEUR" id="hidden-clue">
        {/* Bravo ! Le code est : INSPECTEUR */}
      </div>
      <span className="opacity-0 fixed top-0 pointer-events-none">INSPECTEUR</span>

      <input 
        type="text" 
        placeholder="Entrez le code caché"
        value={code}
        onChange={e => setCode(e.target.value)}
        className="bg-black border border-slate-600 p-2 text-white font-mono w-64 text-center focus:border-neon outline-none"
      />
      <button onClick={check} className="block mx-auto mt-4 px-4 py-2 bg-slate-800 text-cyan-400 border border-cyan-800 hover:border-neon">
        Valider
      </button>
    </div>
  );
};

// --- PUZZLE 9: CIPHER ---
export const Puzzle9Cipher: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  const [input, setInput] = useState('');
  // ROT13 or similar. Let's do a shift +1.
  // Message: "ESCAPE" -> "FTDBQF"
  
  const check = () => {
    playSound('click', isMuted);
    if (input.toUpperCase() === 'ESCAPE') {
      onSolve("CIPHER-BROKEN");
    } else {
      onError("Incorrect Cipher");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-cyan-300 mb-4">DÉCRYPTAGE REQUIS</div>
      <div className="bg-slate-900 p-8 rounded border border-slate-700 mb-6">
        <h3 className="text-3xl font-bold tracking-[0.5em] text-white mb-2">FTDBQF</h3>
        <p className="text-xs text-slate-500 text-center">SHIFT -1</p>
      </div>

      <input 
        value={input}
        onChange={e => setInput(e.target.value)}
        className="bg-transparent border-b-2 border-cyan-700 text-center text-xl text-white outline-none w-48 mb-6 pb-2"
        placeholder="MESSAGE CLAIR"
      />
       <button onClick={check} className="px-8 py-2 bg-cylon-800 hover:bg-cylon-600 text-white font-bold rounded">
        DÉCODER
      </button>
    </div>
  );
};

// --- PUZZLE 10: FINAL ---
export const Puzzle10Final: React.FC<PuzzleProps> = ({ onSolve, onError, isMuted }) => {
  // Simple check for now, assuming user gathered info (though in this implementation we just ask for a final confirmation code "CYLON")
  const [val, setVal] = useState('');
  
  const check = () => {
    playSound('click', isMuted);
    if (val.toUpperCase() === 'LIBERTÉ') {
      onSolve("ESCAPED");
    } else {
      onError("Incorrect Password");
    }
  };

  return (
    <div className="text-center max-w-lg">
      <h2 className="text-2xl font-orbitron text-red-500 animate-pulse mb-6">SÉQUENCE D'AUTODESTRUCTION ACTIVÉE</h2>
      <p className="text-slate-300 mb-4">Entrez le code d'annulation final. Indice: Ce que vous cherchez depuis le début.</p>
      <input 
        type="text" 
        className="w-full bg-red-950/30 border border-red-600 text-red-500 text-center text-3xl font-mono p-4 outline-none focus:bg-red-900/50 mb-6"
        placeholder="MOT DE PASSE"
        value={val}
        onChange={e => setVal(e.target.value)}
      />
      <button onClick={check} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xl shadow-[0_0_20px_#ef4444]">
        ÉVACUER
      </button>
    </div>
  );
};

export const Puzzles = [
  Puzzle1Numeric,
  Puzzle2Sequence,
  Puzzle3Circuit,
  Puzzle4Console,
  Puzzle5Logic,
  Puzzle6Frequency,
  Puzzle7Reflex,
  Puzzle8DOM,
  Puzzle9Cipher,
  Puzzle10Final
];

export const PuzzleData = [
  { id: 1, title: "Matrice Numérique", description: "Identifiez les anomalies mathématiques.", hints: ["Cherchez les nombres premiers.", "Il y en a trois.", "Sélectionnez-les tous pour valider."] },
  { id: 2, title: "Séquence Mémorielle", description: "Reproduisez le schéma de sécurité.", hints: ["Observez l'ordre d'allumage.", "Les couleurs indiquent l'ordre.", "Ne vous pressez pas."] },
  { id: 3, title: "Circuit de Flux", description: "Rétablissez la continuité énergétique.", hints: ["Le flux doit traverser horizontalement.", "Tous les blocs doivent être alignés.", "Cliquez pour tourner."] },
  { id: 4, title: "Terminal Système", description: "Accédez aux fichiers root.", hints: ["Utilisez la commande 'help'.", "Cherchez le fichier password.txt", "La commande est 'unlock gamma'."] },
  { id: 5, title: "Énigme Logique", description: "Localisez la base.", hints: ["La planète rouge.", "Dieu de la guerre romain.", "C'est Mars."] },
  { id: 6, title: "Signal Radio", description: "Calibrez l'onde porteuse.", hints: ["Alignez la ligne verte sur la blanche.", "La cible est autour de 80Hz.", "Regardez les pointillés."] },
  { id: 7, title: "Réflexes", description: "Arrêt d'urgence du noyau.", hints: ["Attendez que le curseur soit au milieu.", "La zone verte est sûre.", "Anticipez le mouvement."] },
  { id: 8, title: "Code Source", description: "Regardez au-delà de l'interface.", hints: ["Le code est caché dans le HTML.", "Utilisez l'inspecteur d'éléments (F12).", "Cherchez l'élément caché."] },
  { id: 9, title: "Cryptographie", description: "Déchiffrez le message.", hints: ["Chaque lettre est décalée.", "Reculez d'une lettre dans l'alphabet.", "F -> E, T -> S..."] },
  { id: 10, title: "Validation Finale", description: "Le dernier obstacle.", hints: ["Quel est le but du jeu ?", "Synonyme d'indépendance.", "Le mot est 'LIBERTÉ'."] },
];