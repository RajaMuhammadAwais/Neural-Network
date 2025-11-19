


import React, { useState, useEffect, useRef } from 'react';
import { np } from '../utils/math';
import { MathDisplay } from '../components/MathDisplay';
import { Gamepad2, Play, FastForward, RefreshCw, RotateCcw } from 'lucide-react';

const GRID_SIZE = 6;
const START = { r: 0, c: 0 };
const GOAL = { r: 4, c: 4 };
const PITS = [{ r: 1, c: 2 }, { r: 2, c: 2 }, { r: 3, c: 4 }, { r: 4, c: 1 }];

type Action = 0 | 1 | 2 | 3; // Up, Down, Left, Right
const ACTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // dr, dc

export const ReinforcementModule: React.FC = () => {
    // State for Rendering
    const [agentPos, setAgentPos] = useState({ r: 0, c: 0 });
    
    // Use Ref for Logic Loop (prevent stale closures)
    // Initialize synchronously to prevent "undefined" errors during first render pass
    const qTableRef = useRef<number[][][]>(
        Array(GRID_SIZE).fill(0).map(() => 
            Array(GRID_SIZE).fill(0).map(() => [0, 0, 0, 0])
        )
    );
    
    // State to force re-render
    const [qTableVersion, setQTableVersion] = useState(0);

    const [episode, setEpisode] = useState(0);
    const [epsilon, setEpsilon] = useState(0.5); // Exploration rate
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(50); // ms per step
    
    // Hyperparameters
    const alpha = 0.1; // Learning Rate
    const gamma = 0.9; // Discount Factor

    const timerRef = useRef<number>(0);

    const getReward = (r: number, c: number) => {
        if (r === GOAL.r && c === GOAL.c) return 10;
        if (PITS.some(p => p.r === r && p.c === c)) return -10;
        return -0.1; // Step cost
    };

    const isTerminal = (r: number, c: number) => {
        return (r === GOAL.r && c === GOAL.c) || PITS.some(p => p.r === r && p.c === c);
    };

    const step = () => {
        setAgentPos(prev => {
            const { r, c } = prev;
            if (isTerminal(r, c)) {
                setEpisode(e => e + 1);
                return { ...START }; // Reset to start
            }

            // Epsilon-Greedy Policy
            let action: number;
            if (Math.random() < epsilon) {
                action = Math.floor(Math.random() * 4); // Explore
            } else {
                // Read from Ref to get latest data
                action = np.argmax(qTableRef.current[r][c]); // Exploit
            }

            const nextR = Math.max(0, Math.min(GRID_SIZE - 1, r + ACTIONS[action][0]));
            const nextC = Math.max(0, Math.min(GRID_SIZE - 1, c + ACTIONS[action][1]));
            
            const reward = getReward(nextR, nextC);
            const maxNextQ = Math.max(...qTableRef.current[nextR][nextC]);
            
            // Update Q-Value directly in Ref
            const currentQ = qTableRef.current[r][c][action];
            qTableRef.current[r][c][action] = currentQ + alpha * (reward + gamma * maxNextQ - currentQ);
            
            setQTableVersion(v => v + 1);

            return { r: nextR, c: nextC };
        });
    };

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = window.setInterval(step, speed);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, speed, epsilon]);

    const getColor = (r: number, c: number) => {
        if (!qTableRef.current || qTableRef.current.length === 0) return 'rgba(30, 41, 59, 0.5)';
        // Color cell based on Max Q-Value
        const maxQ = Math.max(...qTableRef.current[r][c]);
        // Range approx -10 to 10
        const norm = Math.max(-1, Math.min(1, maxQ / 10));
        
        if (r === GOAL.r && c === GOAL.c) return 'rgba(34, 197, 94, 0.8)'; // Green Goal
        if (PITS.some(p => p.r === r && p.c === c)) return 'rgba(239, 68, 68, 0.8)'; // Red Pit
        
        if (norm > 0) return `rgba(34, 197, 94, ${norm * 0.6})`;
        if (norm < 0) return `rgba(239, 68, 68, ${Math.abs(norm) * 0.6})`;
        return 'rgba(30, 41, 59, 0.5)';
    };

    const getArrow = (r: number, c: number) => {
        if (!qTableRef.current || qTableRef.current.length === 0) return null;
        if (isTerminal(r, c)) return null;
        const bestAct = np.argmax(qTableRef.current[r][c]);
        const arrows = ['↑', '↓', '←', '→'];
        return arrows[bestAct];
    };
    
    // Force re-render when version changes
    const qTable = qTableRef.current; 

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
            <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <Gamepad2 className="text-indigo-400"/> Reinforcement Learning
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Exploration Rate (ε): {epsilon.toFixed(2)}</label>
                            <input type="range" min="0" max="1" step="0.1" value={epsilon} onChange={(e) => setEpsilon(parseFloat(e.target.value))} className="w-full accent-indigo-500"/>
                            <p className="text-[10px] text-slate-500 mt-1">High ε = Explore random moves. Low ε = Exploit best strategy.</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Speed</label>
                            <input type="range" min="10" max="500" step="10" value={510 - speed} onChange={(e) => setSpeed(510 - parseInt(e.target.value))} className="w-full accent-indigo-500"/>
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-2 rounded-lg font-bold transition-colors text-white ${isPlaying ? 'bg-yellow-600' : 'bg-green-600'}`}>
                                {isPlaying ? "Pause" : "Start Training"}
                            </button>
                            <button onClick={() => { 
                                qTableRef.current = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0).map(() => [0, 0, 0, 0]));
                                setQTableVersion(v => v+1);
                                setEpisode(0);
                                setAgentPos(START);
                            }} className="px-3 bg-slate-700 rounded-lg text-white">
                                <RotateCcw size={18}/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30">
                    <h3 className="text-sm font-semibold text-indigo-400 mb-3">Q-Learning (Bellman Update)</h3>
                    <MathDisplay formula="Q(s,a) \leftarrow Q(s,a) + \alpha [R + \gamma \max_{a'} Q(s',a') - Q(s,a)]" className="text-xs"/>
                    <p className="text-xs text-slate-500 mt-2">
                        The agent updates its "Quality" (Q) estimate for taking action <em>a</em> in state <em>s</em> based on the immediate reward <em>R</em> and the estimated future value of the next state <em>s'</em>.
                    </p>
                     <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-800 p-2 rounded">
                            <span className="block text-xs text-slate-500">Episode</span>
                            <span className="font-mono font-bold text-white">{episode}</span>
                        </div>
                        <div className="bg-slate-800 p-2 rounded">
                            <span className="block text-xs text-slate-500">Steps</span>
                            <span className="font-mono font-bold text-yellow-400">--</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-center">
                <div 
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 60px)`, gridTemplateRows: `repeat(${GRID_SIZE}, 60px)` }}
                >
                    {qTableRef.current.length > 0 && qTableRef.current.map((row, r) => row.map((_, c) => {
                        const isAgent = agentPos.r === r && agentPos.c === c;
                        return (
                            <div 
                                key={`${r}-${c}`}
                                className="w-[60px] h-[60px] border border-slate-700/50 flex items-center justify-center relative text-sm font-bold transition-colors duration-200"
                                style={{ backgroundColor: getColor(r, c) }}
                            >
                                <span className="opacity-50">{getArrow(r, c)}</span>
                                {isAgent && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse"/>
                                    </div>
                                )}
                                {(r === GOAL.r && c === GOAL.c) && <span className="text-xs absolute bottom-1">GOAL</span>}
                            </div>
                        );
                    }))}
                </div>
            </div>
        </div>
    );
};