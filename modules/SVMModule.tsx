
import React, { useState, useRef, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from 'recharts';
import { MathDisplay } from '../components/MathDisplay';
import { ShieldCheck, Play, RotateCcw, PlusCircle } from 'lucide-react';

interface SVMPoint { x: number; y: number; label: number; isSupportVector?: boolean; }

export const SVMModule: React.FC = () => {
    const [points, setPoints] = useState<SVMPoint[]>([]);
    const [w, setW] = useState({ w1: 0.5, w2: -0.5 });
    const [b, setB] = useState(0);
    const [C, setC] = useState(1.0); // Regularization (Cost)
    const [isPlaying, setIsPlaying] = useState(false);
    const [epoch, setEpoch] = useState(0);
    
    const requestRef = useRef<number>(0);

    useEffect(() => {
        // Initialize separable data
        const initPoints: SVMPoint[] = [
            { x: 2, y: 3, label: 1 }, { x: 3, y: 4, label: 1 }, { x: 2, y: 5, label: 1 },
            { x: 5, y: 1, label: -1 }, { x: 6, y: 2, label: -1 }, { x: 6, y: 0, label: -1 }
        ];
        setPoints(initPoints);
    }, []);

    // Hinge Loss Gradient Descent
    const trainStep = () => {
        const lr = 0.01;
        let dw1 = 0, dw2 = 0, db = 0;
        const n = points.length;
        
        // Gradient of L2 Regularization term: lambda * ||w||^2 -> derivative is lambda * w
        // Note: SVM minimizes ||w||^2 + C * Sum(hinge)
        // We can view this as minimizing: 1/2 ||w||^2 + C * Loss
        
        // Gradients
        let gradW1 = w.w1; // Derivative of 0.5*w^2 is w
        let gradW2 = w.w2;
        let gradB = 0;

        points.forEach(p => {
            const ti = p.label; // target: +1 or -1
            const val = w.w1 * p.x + w.w2 * p.y + b;
            // Hinge Loss condition: max(0, 1 - ti * val)
            // If 1 - ti * val > 0, then we have error/margin violation
            if (1 - ti * val > 0) {
                // Derivative of -C * ti * (w.x + b)
                gradW1 -= C * ti * p.x;
                gradW2 -= C * ti * p.y;
                gradB -= C * ti;
                p.isSupportVector = true;
            } else {
                p.isSupportVector = false;
            }
        });

        setW({ w1: w.w1 - lr * gradW1, w2: w.w2 - lr * gradW2 });
        setB(prev => prev - lr * gradB);
        setEpoch(e => e + 1);
    };

    useEffect(() => {
        if(isPlaying) {
            const loop = () => {
                for(let i=0; i<10; i++) trainStep(); // Speed up
                requestRef.current = requestAnimationFrame(loop);
            };
            requestRef.current = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, w, b, points, C]);

    // Calculate boundary lines
    // w1*x + w2*y + b = 0 => y = -(w1/w2)x - b/w2
    const generateLine = (offset: number) => {
        return [
            { x: 0, y: -(w.w1 * 0 + b - offset) / w.w2 },
            { x: 10, y: -(w.w1 * 10 + b - offset) / w.w2 }
        ];
    };

    const boundary = generateLine(0);
    const marginPos = generateLine(1);
    const marginNeg = generateLine(-1);

    const addRandomPoint = () => {
        const label = Math.random() > 0.5 ? 1 : -1;
        setPoints([...points, { x: Math.random()*8, y: Math.random()*8, label }]);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
            <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <ShieldCheck className="text-indigo-400"/> SVM Classifier
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">C (Regularization) - {C}</label>
                            <input type="range" min="0.1" max="10" step="0.1" value={C} onChange={(e) => setC(parseFloat(e.target.value))} className="w-full accent-indigo-500"/>
                            <p className="text-[10px] text-slate-500 mt-1">High C = Strict Margins (Hard Margin). Low C = Tolerates errors (Soft Margin).</p>
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-2 rounded-lg font-bold transition-colors text-white ${isPlaying ? 'bg-yellow-600' : 'bg-green-600'}`}>
                                {isPlaying ? "Pause" : "Train SVM"}
                            </button>
                            <button onClick={() => { setW({ w1: 0.5, w2: -0.5}); setB(0); setEpoch(0); setIsPlaying(false); }} className="px-3 bg-slate-700 rounded-lg text-white">
                                <RotateCcw size={18}/>
                            </button>
                        </div>
                        <button onClick={addRandomPoint} className="w-full py-2 border border-slate-600 text-slate-400 rounded hover:bg-slate-700 flex items-center justify-center gap-2">
                             <PlusCircle size={16}/> Add Data Point
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30">
                    <h3 className="text-sm font-semibold text-indigo-400 mb-3">Max Margin Optimization</h3>
                    <MathDisplay formula="L = \frac{1}{2}||w||^2 + C \sum \max(0, 1 - y_i(w \cdot x + b))" className="text-xs"/>
                    <p className="text-xs text-slate-500 mt-2">
                        SVM tries to find the widest possible "street" (margin) between classes. Points on the dotted lines or inside the street are <strong>Support Vectors</strong>.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-800 p-2 rounded">
                            <span className="block text-xs text-slate-500">Epoch</span>
                            <span className="font-mono font-bold text-white">{epoch}</span>
                        </div>
                        <div className="bg-slate-800 p-2 rounded">
                            <span className="block text-xs text-slate-500">Support Vectors</span>
                            <span className="font-mono font-bold text-yellow-400">{points.filter(p=>p.isSupportVector).length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" dataKey="x" domain={[0, 10]} stroke="#94a3b8" allowDataOverflow />
                        <YAxis type="number" dataKey="y" domain={[0, 10]} stroke="#94a3b8" allowDataOverflow />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}/>
                        
                        {/* Data Points */}
                        <Scatter data={points} shape="circle">
                            {points.map((entry, index) => (
                                <Cell key={`cell-${index}`} 
                                    fill={entry.label === 1 ? '#3b82f6' : '#ef4444'} 
                                    stroke={entry.isSupportVector ? '#fbbf24' : 'none'} 
                                    strokeWidth={3}
                                />
                            ))}
                        </Scatter>

                        {/* Hyperplane and Margins */}
                        <Scatter data={boundary} line={{ stroke: 'white', strokeWidth: 3 }} shape={() => null} isAnimationActive={false} />
                        <Scatter data={marginPos} line={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} shape={() => null} isAnimationActive={false} />
                        <Scatter data={marginNeg} line={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '5 5' }} shape={() => null} isAnimationActive={false} />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
