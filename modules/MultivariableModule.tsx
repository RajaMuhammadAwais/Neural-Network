
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MathDisplay } from '../components/MathDisplay';
import { Mountain, RefreshCw, Zap, Activity, Target } from 'lucide-react';

type OptimizerType = 'SGD' | 'Momentum' | 'Adam';
type SurfaceType = 'bowl' | 'saddle';

export const MultivariableModule: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ball, setBall] = useState({ x: 2.5, y: 2.5 });
  const [path, setPath] = useState<{x: number, y: number}[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [optimizer, setOptimizer] = useState<OptimizerType>('SGD');
  const [surface, setSurface] = useState<SurfaceType>('bowl');
  const animationRef = useRef<number>(0);

  // Optimizer State Refs
  const velocity = useRef({ vx: 0, vy: 0 }); // For Momentum
  const adamState = useRef({ m_dx: 0, m_dy: 0, v_dx: 0, v_dy: 0, t: 0 }); // For Adam

  // Surface Functions & Gradients
  const f = (x: number, y: number) => surface === 'bowl' ? x*x + y*y : x*x - y*y;
  const grad = (x: number, y: number) => surface === 'bowl' ? ({ dx: 2*x, dy: 2*y }) : ({ dx: 2*x, dy: -2*y });

  // Draw Heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const range = 8; // -4 to 4
    
    // Draw Heatmap Pixels
    const imgData = ctx.createImageData(width, height);
    for (let py = 0; py < height; py+=2) {
      for (let px = 0; px < width; px+=2) {
        const x = (px / width) * range - (range/2);
        const y = -((py / height) * range - (range/2)); 
        const z = f(x, y);
        
        let r, g, b;
        
        if (surface === 'bowl') {
             const normalizedZ = Math.min(z / 32, 1); 
             r = Math.floor(normalizedZ * 255);
             g = Math.floor((1 - normalizedZ) * 100);
             b = Math.floor((1 - normalizedZ) * 255);
        } else {
            // Saddle: Map -16 to 16 range roughly
            const normalized = Math.max(-1, Math.min(1, z / 16));
            // Red is positive, Blue is negative, Black is zero
            r = normalized > 0 ? Math.floor(normalized * 255) : 0;
            g = 20;
            b = normalized < 0 ? Math.floor(Math.abs(normalized) * 255) : 0;
        }
        
        // 2x2 block fill
        const idx = (py * width + px) * 4;
        for(let dy=0; dy<2; dy++) {
           for(let dx=0; dx<2; dx++) {
              if (py+dy < height && px+dx < width) {
                 const i = ((py+dy)*width + (px+dx))*4;
                 imgData.data[i] = r; imgData.data[i+1] = g; imgData.data[i+2] = b; imgData.data[i+3] = 255;
              }
           }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<=width; i+=width/8) { ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();
    
    // Path
    if (path.length > 0) {
        ctx.strokeStyle = optimizer === 'Adam' ? '#a78bfa' : optimizer === 'Momentum' ? '#f472b6' : '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        path.forEach((p, i) => {
            const sx = ((p.x + 4) / 8) * width;
            const sy = ((-p.y + 4) / 8) * height;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
    }

    // Ball
    const screenX = ((ball.x + 4) / 8) * width;
    const screenY = ((-ball.y + 4) / 8) * height;
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  }, [ball, path, optimizer, surface]);

  const step = useCallback(() => {
     setBall(prev => {
         const { dx, dy } = grad(prev.x, prev.y);
         let newX = prev.x;
         let newY = prev.y;
         const lr = 0.02; // Base Learning Rate

         if (optimizer === 'SGD') {
             newX = prev.x - lr * dx * 2; 
             newY = prev.y - lr * dy * 2;
         } 
         else if (optimizer === 'Momentum') {
             const beta = 0.9;
             velocity.current.vx = beta * velocity.current.vx + (1 - beta) * dx;
             velocity.current.vy = beta * velocity.current.vy + (1 - beta) * dy;
             
             newX = prev.x - lr * 3 * velocity.current.vx; 
             newY = prev.y - lr * 3 * velocity.current.vy;
         }
         else if (optimizer === 'Adam') {
             const beta1 = 0.9;
             const beta2 = 0.999;
             const epsilon = 1e-8;
             adamState.current.t += 1;
             
             adamState.current.m_dx = beta1 * adamState.current.m_dx + (1 - beta1) * dx;
             adamState.current.m_dy = beta1 * adamState.current.m_dy + (1 - beta1) * dy;
             
             adamState.current.v_dx = beta2 * adamState.current.v_dx + (1 - beta2) * (dx * dx);
             adamState.current.v_dy = beta2 * adamState.current.v_dy + (1 - beta2) * (dy * dy);
             
             const m_hat_dx = adamState.current.m_dx / (1 - Math.pow(beta1, adamState.current.t));
             const m_hat_dy = adamState.current.m_dy / (1 - Math.pow(beta1, adamState.current.t));
             
             const v_hat_dx = adamState.current.v_dx / (1 - Math.pow(beta2, adamState.current.t));
             const v_hat_dy = adamState.current.v_dy / (1 - Math.pow(beta2, adamState.current.t));
             
             newX = prev.x - (lr * 2) * m_hat_dx / (Math.sqrt(v_hat_dx) + epsilon);
             newY = prev.y - (lr * 2) * m_hat_dy / (Math.sqrt(v_hat_dy) + epsilon);
         }
         
         // Bounds Check
         if (Math.abs(newX) > 4 || Math.abs(newY) > 4) {
            setIsRolling(false);
            return prev;
         }

         // Stop condition
         if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
             setIsRolling(false);
             return prev;
         }
         
         setPath(curr => [...curr, {x: newX, y: newY}]);
         return { x: newX, y: newY };
     });
  }, [optimizer, surface]);

  useEffect(() => {
      if (isRolling) {
          animationRef.current = requestAnimationFrame(step);
      }
      return () => cancelAnimationFrame(animationRef.current);
  }, [isRolling, step]);

  const handleReset = () => {
      setIsRolling(false);
      const rX = (Math.random() * 6) - 3;
      const rY = (Math.random() * 6) - 3;
      setBall({ x: rX, y: rY });
      setPath([{ x: rX, y: rY }]);
      velocity.current = { vx: 0, vy: 0 };
      adamState.current = { m_dx: 0, m_dy: 0, v_dx: 0, v_dy: 0, t: 0 };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
       <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                 <Mountain className="text-indigo-400"/> Optimization Research
             </h2>
             
             <div className="space-y-6">
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex gap-2 items-center">
                        <Target size={14}/> Loss Landscape
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => { setSurface('bowl'); handleReset(); }}
                            className={`p-2 rounded text-xs font-bold border ${surface === 'bowl' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-700 border-slate-600'}`}
                        >
                            Convex Bowl
                        </button>
                        <button 
                            onClick={() => { setSurface('saddle'); handleReset(); }}
                            className={`p-2 rounded text-xs font-bold border ${surface === 'saddle' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-700 border-slate-600'}`}
                        >
                            Saddle Point
                        </button>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Optimizer</label>
                    <div className="flex flex-col gap-2">
                        {(['SGD', 'Momentum', 'Adam'] as OptimizerType[]).map(opt => (
                            <button 
                                key={opt}
                                onClick={() => { setOptimizer(opt); handleReset(); }}
                                className={`p-3 rounded-lg text-left text-sm font-medium border transition-all ${optimizer === opt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                 </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsRolling(!isRolling)} 
                        className={`flex-1 py-2 rounded-lg font-bold text-white transition-colors ${isRolling ? 'bg-yellow-600' : 'bg-green-600'}`}
                    >
                        {isRolling ? "Pause" : "Optimize"}
                    </button>
                    <button onClick={handleReset} className="px-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                        <RefreshCw/>
                    </button>
                </div>
             </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30">
             <h3 className="text-sm font-semibold text-indigo-400 mb-3">Algorithm Details</h3>
             {surface === 'saddle' && (
                 <p className="text-xs text-red-400 mb-2 bg-red-400/10 p-2 rounded">
                    Research Note: Saddle points have zero gradient but aren't minima. SGD often gets stuck here, while Momentum/Adam can escape using velocity.
                 </p>
             )}
             {optimizer === 'SGD' && (
                 <>
                    <MathDisplay formula="\theta_{t+1} = \theta_t - \alpha \nabla J(\theta_t)" />
                    <p className="text-xs text-slate-500 mt-2">Standard descent. Can be slow and get stuck in saddle points.</p>
                 </>
             )}
             {optimizer === 'Momentum' && (
                 <>
                    <MathDisplay formula="v_t = \gamma v_{t-1} + \alpha \nabla J(\theta_t)" />
                    <p className="text-xs text-slate-500 mt-2">Accelerates vectors in the right direction, helping escape shallow local minima.</p>
                 </>
             )}
             {optimizer === 'Adam' && (
                 <>
                    <MathDisplay formula="m_t = \beta_1 m_{t-1}..." />
                    <p className="text-xs text-slate-500 mt-2">Adaptive Moment Estimation. The gold standard in modern research.</p>
                 </>
             )}
          </div>
       </div>

       <div className="lg:col-span-2 bg-black rounded-xl overflow-hidden border border-slate-700 flex flex-col items-center justify-center h-[500px] relative">
          <div className="absolute top-4 left-4 z-10 bg-black/50 px-3 py-1 rounded text-white text-xs flex items-center gap-2">
              {optimizer === 'SGD' && <Activity size={14}/>}
              {optimizer === 'Momentum' && <Zap size={14} className="text-yellow-400"/>}
              {optimizer === 'Adam' && <Activity size={14} className="text-purple-400"/>}
              {optimizer} on {surface === 'bowl' ? 'Convex' : 'Saddle'} Surface
          </div>
          <div className="flex-1 w-full relative min-h-0">
            <canvas 
                ref={canvasRef} 
                width={600} 
                height={600} 
                className="w-full h-full object-contain"
            />
          </div>
       </div>
    </div>
  );
};
