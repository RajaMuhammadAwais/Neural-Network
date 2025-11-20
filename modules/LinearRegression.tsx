
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Matrix, np } from '../utils/math';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart, Legend, BarChart, Bar, ReferenceLine, Cell } from 'recharts';
import { MathDisplay } from '../components/MathDisplay';
import { Play, Pause, SkipForward, RefreshCw, BarChart2, AlertTriangle, Calculator, Edit3, Gauge, ZoomIn, Grid, Settings, Microscope } from 'lucide-react';

type LossType = 'MSE' | 'MAE';
type RegType = 'None' | 'L1' | 'L2';

export const LinearRegressionModule: React.FC = () => {
  const [points, setPoints] = useState<{ x: number, y: number, residual?: number }[]>([]);
  // UI State for W and B (synced from refs for rendering)
  const [w, setW] = useState(0);
  const [b, setB] = useState(0);
  
  // Physics Refs (for high-speed loops)
  const wRef = useRef(0);
  const bRef = useRef(0);

  const [epoch, setEpoch] = useState(0);
  const [lossHistory, setLossHistory] = useState<{ epoch: number, loss: number }[]>([]);
  const [pathHistory, setPathHistory] = useState<{ w: number, b: number }[]>([]);
  const [learningRate, setLearningRate] = useState(0.01);
  const [regRate, setRegRate] = useState(0.1); // Regularization Lambda
  const [isPlaying, setIsPlaying] = useState(false);
  const [rSquared, setRSquared] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(1.5);
  const [solverMode, setSolverMode] = useState<'iterative' | 'analytical'>('iterative');
  const [lossType, setLossType] = useState<LossType>('MSE');
  const [regType, setRegType] = useState<RegType>('None');
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [dataInput, setDataInput] = useState("");
  const [seed, setSeed] = useState(12345); // Research Seed
  
  // New View Controls
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // Iterations per frame
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dataCount, setDataCount] = useState(20);
  
  const requestRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Robust formatting helpers
  const isFiniteNumber = (n: number) => Number.isFinite(n) && !Number.isNaN(n);
  const formatCompact = (n: number, digits = 4) => {
    if (!isFiniteNumber(n)) return '—';
    const abs = Math.abs(n);
    if (abs === 0) return '0';
    if (abs >= 1e6 || abs < 1e-3) return n.toExponential(3);
    return n.toFixed(digits);
  };
  const clip = (v: number, limit = 1e6) => Math.max(-limit, Math.min(limit, v));

  const generateData = useCallback(() => {
    np.seed(seed); // Enforce Reproducibility
    const newPoints = [];
    // Generate dataCount points spread across 0-10
    for (let i = 0; i < dataCount; i++) {
      const x = (i / dataCount) * 10; 
      // Use seeded random generator through np/Matrix helper or just simple equation for now
      const randomVal = (np.randomNormal(1,1,0,1).data[0][0]); // Using seeded normal
      const y = 2 * x + 1 + (randomVal * noiseLevel); 
      newPoints.push({ x, y, residual: 0 });
    }
    setPoints(newPoints);
    resetModel();
  }, [noiseLevel, dataCount, seed]);

  const resetModel = () => {
    const startW = Math.random() * 4;
    const startB = Math.random() * 4;
    
    setW(startW);
    setB(startB);
    wRef.current = startW;
    bRef.current = startB;
    
    setEpoch(0);
    setLossHistory([]);
    setPathHistory([]);
    setIsPlaying(false);
  };

  useEffect(() => { generateData(); }, [generateData]);

  const addOutlier = () => {
      setPoints(prev => [...prev, { x: 8, y: -5, residual: 0 }]); 
  };

  const parseDataInput = () => {
      const lines = dataInput.split('\n');
      const newPoints: { x: number; y: number; residual?: number }[] = [];
      for(const line of lines) {
          const parts = line.split(',').map(s => s.trim());
          if(parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
              const px = parseFloat(parts[0]);
              const py = parseFloat(parts[1]);
              if (isFiniteNumber(px) && isFiniteNumber(py)) {
                newPoints.push({ x: px, y: py, residual: 0 });
              }
          }
      }
      if(newPoints.length > 1) {
          setPoints(newPoints);
          setShowDataEditor(false);
          resetModel();
      } else {
          alert("Invalid data format. Please use 'x,y' format with at least 2 points.");
      }
  };

  useEffect(() => {
    if (points.length === 0) return;
    const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);

    // Guard against degenerate cases and non-finite values
    if (!isFiniteNumber(ssTot) || ssTot === 0) {
      setRSquared(0);
      return;
    }

    const ssRes = points.reduce((sum, p) => sum + Math.pow(p.y - (w * p.x + b), 2), 0);
    const r2 = 1 - (ssRes / ssTot);
    setRSquared(isFiniteNumber(r2) ? r2 : 0);
    
    // Update residuals in points state (without triggering loop, just for visualization derivation)
    // Actually, best to compute derived state in render or useEffect for chart
  }, [w, b, points]); 
  
  const residualsData = points
    .map(p => ({
      x: p.x,
      residual: p.y - (w * p.x + b)
    }))
    .filter(d => isFiniteNumber(d.x) && isFiniteNumber(d.residual));

  // Draw Landscape
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Use internal resolution for drawing, scaled by CSS
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate bounds based on zoom level
    const wCenter = 2;
    const bCenter = 1.5;
    const wSpan = 4 / zoomLevel;
    const bSpan = 7 / zoomLevel;

    const wMin = wCenter - wSpan / 2;
    const wMax = wCenter + wSpan / 2;
    const bMin = bCenter - bSpan / 2;
    const bMax = bCenter + bSpan / 2;
    
    const imgData = ctx.createImageData(width, height);
    for(let py = 0; py < height; py+=2) { 
        for(let px = 0; px < width; px+=2) {
            const currW = wMin + (px / width) * (wMax - wMin);
            const currB = bMax - (py / height) * (bMax - bMin);
            let sumLoss = 0;
            
            // Calculate Loss based on selected algorithm
            for(let i=0; i<points.length; i++) {
                const yHat = currW * points[i].x + currB;
                const err = points[i].y - yHat;
                if (lossType === 'MSE') sumLoss += err * err;
                else sumLoss += Math.abs(err);
            }
            let loss = sumLoss / points.length;
            
            // Add Reg
            if (regType === 'L2') loss += regRate * currW * currW;
            if (regType === 'L1') loss += regRate * Math.abs(currW);

            const val = Math.min(loss / (lossType === 'MSE' ? 50 : 10), 1); 
            const r = Math.floor(val * 255);
            const g = Math.floor((1-val) * 50);
            const bVal = Math.floor((1-val) * 200 + 55);
            
            // Fill 2x2 pixel blocks for performance
            const idx = ((py) * width + (px)) * 4;
            imgData.data[idx] = r; imgData.data[idx+1] = g; imgData.data[idx+2] = bVal; imgData.data[idx+3] = 255;
            imgData.data[idx+4] = r; imgData.data[idx+5] = g; imgData.data[idx+6] = bVal; imgData.data[idx+7] = 255;
            const idx2 = ((py+1) * width + (px)) * 4;
            imgData.data[idx2] = r; imgData.data[idx2+1] = g; imgData.data[idx2+2] = bVal; imgData.data[idx2+3] = 255;
            imgData.data[idx2+4] = r; imgData.data[idx2+5] = g; imgData.data[idx2+6] = bVal; imgData.data[idx2+7] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    
    if (pathHistory.length > 0) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        pathHistory.forEach((p, i) => {
            const px = ((p.w - wMin) / (wMax - wMin)) * width;
            const py = ((bMax - p.b) / (bMax - bMin)) * height;
            
            const clampedPx = Math.max(-5000, Math.min(width + 5000, px));
            const clampedPy = Math.max(-5000, Math.min(height + 5000, py));

            if (i===0) ctx.moveTo(clampedPx, clampedPy); else ctx.lineTo(clampedPx, clampedPy);
        });
        ctx.stroke();

        // Draw current point (ball)
        const last = pathHistory[pathHistory.length-1];
        const px = ((last.w - wMin) / (wMax - wMin)) * width;
        const py = ((bMax - last.b) / (bMax - bMin)) * height;
        
        if (px > -20 && px < width + 20 && py > -20 && py < height + 20) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI*2);
            ctx.fill();
        }
    }
  }, [points, pathHistory, zoomLevel, lossType, regType, regRate]);

  const solveAnalytical = () => {
      const n = points.length;
      if (n === 0) return;

      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for(const p of points) {
          sumX += p.x;
          sumY += p.y;
          sumXY += p.x * p.y;
          sumXX += p.x * p.x;
      }
      // Add Ridge (L2) penalty diagonal roughly if enabled (Simplified for 1D)
      let denom = (n * sumXX - sumX * sumX);
      if (regType === 'L2') denom += regRate * n; 
      if (!isFiniteNumber(denom) || denom === 0) return;

      const m = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - m * sumX) / n;
      if (!isFiniteNumber(m) || !isFiniteNumber(intercept)) return;
      
      setW(m);
      setB(intercept);
      wRef.current = m;
      bRef.current = intercept;
      
      let ss = 0;
      for(const p of points) ss += Math.pow(p.y - (m*p.x + intercept), 2);
      const mse = ss / n;
      
      if (isFiniteNumber(mse)) {
        setLossHistory(prev => [...prev, { epoch: prev.length, loss: mse }]);
      }
      setPathHistory(prev => [...prev, { w: m, b: intercept }]);
  };

  const performTrainingStep = () => {
    if (points.length === 0) return null;
    
    const currentW = wRef.current;
    const currentB = bRef.current;
    
    let dw = 0;
    let db = 0;
    let totalLoss = 0;
    const m = points.length;
    
    for(let i=0; i<m; i++) {
        const p = points[i];
        const yHat = currentW * p.x + currentB;
        const error = yHat - p.y;
        
        if (lossType === 'MSE') {
            totalLoss += error * error;
            dw += error * p.x; 
            db += error;
        } else {
            totalLoss += Math.abs(error);
            const sign = error > 0 ? 1 : error < 0 ? -1 : 0;
            dw += sign * p.x;
            db += sign;
        }
    }
    
    if (lossType === 'MSE') {
        dw = (2/m) * dw;
        db = (2/m) * db;
        totalLoss /= m;
    } else {
        dw = (1/m) * dw;
        db = (1/m) * db;
        totalLoss /= m;
    }

    if (regType === 'L2') {
        dw += 2 * regRate * currentW;
        totalLoss += regRate * currentW * currentW;
    }
    if (regType === 'L1') {
        dw += regRate * (currentW > 0 ? 1 : -1);
        totalLoss += regRate * Math.abs(currentW);
    }

    // Gradient clipping for robustness on extreme values
    dw = clip(dw);
    db = clip(db);
    
    const newW = currentW - learningRate * dw;
    const newB = currentB - learningRate * db;
    
    wRef.current = newW;
    bRef.current = newB;
    
    const safeLoss = isFiniteNumber(totalLoss) ? totalLoss : Number.POSITIVE_INFINITY;
    return { w: newW, b: newB, loss: safeLoss };
  };

  // The loop that runs every frame
  useEffect(() => {
    let lastResult: any = null;
    
    const animate = () => {
        if (!isPlaying || solverMode !== 'iterative') return;

        for(let i=0; i<playbackSpeed; i++) {
            lastResult = performTrainingStep();
        }

        if (lastResult) {
            setW(lastResult.w);
            setB(lastResult.b);
            setEpoch(prev => prev + playbackSpeed);
            if (isFiniteNumber(lastResult.loss)) {
              setLossHistory(prev => [...prev, { epoch: prev.length + playbackSpeed, loss: lastResult.loss }]);
            }
            setPathHistory(prev => [...prev, { w: lastResult.w, b: lastResult.b }]);
        }
        
        requestRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying && solverMode === 'iterative') {
        requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, solverMode, playbackSpeed, learningRate, points, lossType, regType, regRate]);

  const manualStep = () => {
      const res = performTrainingStep();
      if (res) {
        setW(res.w);
        setB(res.b);
        setEpoch(prev => prev + 1);
        if (isFiniteNumber(res.loss)) {
          setLossHistory(prev => [...prev, { epoch: prev.length + 1, loss: res.loss }]);
        }
        setPathHistory(prev => [...prev, { w: res.w, b: res.b }]);
      }
  };

  const regressionLine = (isFiniteNumber(w) && isFiniteNumber(b)) ? [{ x: 0, y: b }, { x: 10, y: w * 10 + b }] : [];
  const xDomain: [number, number] = [5 - 5/zoomLevel, 5 + 5/zoomLevel];

  const getFormula = () => {
      let base = "";
      if (lossType === 'MSE') base = "L = \\\\frac{1}{m}\\\\sum (\\\\hat{y}-y)^2";
      else base = "L = \\\\frac{1}{m}\\\\sum |\\\\hat{y}-y|";
      
      if (regType === 'L2') base += " + \\\\lambda w^2";
      if (regType === 'L1') base += " + \\\\lambda |w|";
      return base;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center justify-between">
              Setup
              <button onClick={() => { setShowDataEditor(!showDataEditor); setDataInput(points.map(p => `${p.x.toFixed(2)}, ${p.y.toFixed(2)}`).join('\n')); }} className="text-xs bg-slate-700 p-2 rounded hover:bg-slate-600" title="Edit Data">
                  <Edit3 size={16}/>
              </button>
          </h2>
          
          {showDataEditor ? (
              <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-1">CSV Input (x,y)</p>
                  <textarea value={dataInput} onChange={(e) => setDataInput(e.target.value)} className="w-full h-32 bg-slate-900 text-xs font-mono text-white p-2 rounded border border-slate-600 focus:border-indigo-500 outline-none"></textarea>
                  <div className="flex gap-2 mt-2">
                      <button onClick={parseDataInput} className="flex-1 bg-indigo-600 text-white py-1 rounded text-xs">Update Data</button>
                      <button onClick={() => setShowDataEditor(false)} className="flex-1 bg-slate-700 text-white py-1 rounded text-xs">Cancel</button>
                  </div>
              </div>
          ) : (
              <div className="space-y-4">
                {/* Algorithm Selection */}
                <div className="bg-slate-900 p-3 rounded border border-slate-600">
                     <div className="flex items-center gap-2 mb-2">
                         <Settings size={14} className="text-slate-400"/>
                         <span className="text-xs font-bold text-slate-400 uppercase">Algorithm Config</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 mb-2">
                         <div>
                             <label className="text-[10px] text-slate-500 block">Loss Function</label>
                             <select value={lossType} onChange={(e) => setLossType(e.target.value as LossType)} className="w-full bg-slate-800 text-xs text-white p-1 rounded border border-slate-600">
                                 <option value="MSE">MSE (Squared)</option>
                                 <option value="MAE">MAE (Absolute)</option>
                             </select>
                         </div>
                         <div>
                             <label className="text-[10px] text-slate-500 block">Regularization</label>
                             <select value={regType} onChange={(e) => setRegType(e.target.value as RegType)} className="w-full bg-slate-800 text-xs text-white p-1 rounded border border-slate-600">
                                 <option value="None">None</option>
                                 <option value="L2">Ridge (L2)</option>
                                 <option value="L1">Lasso (L1)</option>
                             </select>
                         </div>
                     </div>
                     {(regType !== 'None') && (
                         <div>
                             <label className="text-[10px] text-slate-500 block">Reg Rate (λ): {regRate}</label>
                             <input type="range" min="0.1" max="5" step="0.1" value={regRate} onChange={(e) => setRegRate(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-1"/>
                         </div>
                     )}
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-600 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-2"><Gauge size={14}/> Speed ({playbackSpeed}x)</label>
                        <input type="range" min="1" max="20" step="1" value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))} className="w-24 accent-indigo-500 h-1"/>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-2"><ZoomIn size={14}/> Zoom ({zoomLevel}x)</label>
                        <input type="range" min="0.5" max="3" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} className="w-24 accent-indigo-500 h-1"/>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-2"><Grid size={14}/> Points ({dataCount})</label>
                        <input type="range" min="10" max="200" step="10" value={dataCount} onChange={(e) => setDataCount(parseInt(e.target.value))} className="w-24 accent-indigo-500 h-1"/>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Solver Method</label>
                    <div className="grid grid-cols-2 gap-1">
                        <button onClick={() => setSolverMode('iterative')} className={`py-1 text-xs rounded border ${solverMode === 'iterative' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>Iterative (GD)</button>
                        <button onClick={() => { setSolverMode('analytical'); setIsPlaying(false); }} className={`py-1 text-xs rounded border ${solverMode === 'analytical' ? 'bg-teal-600 border-teal-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>Exact (Normal Eq)</button>
                    </div>
                </div>

                {solverMode === 'iterative' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Learning Rate: {learningRate}</label>
                      <input type="range" min="0.001" max="0.1" step="0.001" value={learningRate} onChange={(e) => setLearningRate(parseFloat(e.target.value))} className="w-full accent-indigo-500"/>
                    </div>
                )}
                
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block flex justify-between">
                        <span>Data Noise</span>
                        <span>Seed: {seed}</span>
                    </label>
                    <input type="range" min="0" max="5" step="0.5" value={noiseLevel} onChange={(e) => setNoiseLevel(parseFloat(e.target.value))} className="w-full accent-indigo-500"/>
                    <div className="flex justify-end mt-1">
                         <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value))} className="w-20 bg-slate-900 border border-slate-600 text-xs text-white rounded px-1"/>
                    </div>
                </div>
                
                <div className="bg-slate-900 p-3 rounded border border-indigo-500/30 flex items-center justify-between">
                    <span className="text-sm text-indigo-300 font-semibold flex items-center gap-2"><AlertTriangle size={14}/> Robustness</span>
                    <button onClick={addOutlier} className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded">Add Outlier</button>
                </div>

                <div className="flex gap-2">
                  {solverMode === 'iterative' ? (
                      <>
                        <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-2 rounded-lg font-bold transition-colors ${isPlaying ? 'bg-yellow-600' : 'bg-green-600'} text-white`}>{isPlaying ? "Pause" : "Train"}</button>
                        <button onClick={manualStep} disabled={isPlaying} className="px-4 bg-slate-700 rounded-lg text-white"><SkipForward size={18}/></button>
                      </>
                  ) : (
                       <button onClick={solveAnalytical} className="flex-1 py-2 rounded-lg font-bold bg-teal-600 text-white flex items-center justify-center gap-2"><Calculator size={16}/> Solve Instantly</button>
                  )}
                  <button onClick={generateData} className="px-4 bg-slate-700 rounded-lg text-white"><RefreshCw size={18}/></button>
                </div>
              </div>
          )}
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Fit Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-3 rounded text-center">
                    <div className="text-xs text-slate-500 uppercase">R-Squared</div>
                    <div className={`text-xl font-mono font-bold ${rSquared > 0.8 ? 'text-green-400' : rSquared > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>{formatCompact(rSquared)}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded text-center">
                    <div className="text-xs text-slate-500 uppercase">{lossType} Loss</div>
                    <div className="text-xl font-mono font-bold text-red-400">{lossHistory.length > 0 ? formatCompact(lossHistory[lossHistory.length-1].loss, 3) : '0.0'}</div>
                </div>
            </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[400px]">
            {/* Main Plot */}
            <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="x" type="number" domain={xDomain} allowDataOverflow stroke="#94a3b8" tickFormatter={(v) => formatCompact(v as number, 2)} />
                    <YAxis dataKey="y" type="number" domain={['auto', 'auto']} stroke="#94a3b8" tickFormatter={(v) => formatCompact(v as number, 2)} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#fff' }}/>
                    <Legend />
                    <Scatter name="Data" data={points} fill="#818cf8" />
                    {regressionLine.length > 0 && (
                      <Line name="Regression" data={regressionLine} dataKey="y" stroke="#f472b6" strokeWidth={3} dot={false} animationDuration={0} />
                    )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Residual Plot (Scientist Upgrade) */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
                 <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Microscope size={14}/> Residual Analysis</h3>
                 <div className="flex-1 min-h-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={residualsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                            <XAxis dataKey="x" type="number" domain={[0, 10]} hide/>
                            <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => formatCompact(v as number, 2)}/>
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', fontSize: '12px' }}/>
                            <ReferenceLine y={0} stroke="#fff" strokeOpacity={0.5}/>
                            <Bar dataKey="residual" fill="#ef4444" radius={[2, 2, 0, 0]}>
                                {residualsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.residual > 0 ? '#34d399' : '#f87171'} />
                                ))}
                            </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                 </div>
                 <p className="text-[10px] text-slate-500 mt-2">
                     Patterns in residuals indicate heteroscedasticity or non-linearity. Random scatter is ideal.
                 </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-[250px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 shrink-0">Cost Surface Descent</h3>
            <div className="w-full flex-1 relative bg-black rounded overflow-hidden min-h-0 flex flex-col">
                 <div className="flex-1 relative min-h-0">
                     <canvas ref={canvasRef} width={300} height={200} className="w-full h-full object-fill" />
                 </div>
            </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30 h-[250px] overflow-y-auto">
             <h3 className="text-sm font-semibold text-indigo-400 mb-2">Research Notes</h3>
             <div className="space-y-4">
                {solverMode === 'analytical' ? (
                    <p className="text-xs text-slate-300">
                        <strong>Normal Equation:</strong> The optimal parameters are found in one step using Matrix Calculus: $\theta = (X^TX)^{-1}X^Ty$. This is extremely fast for small datasets but $O(n^3)$ slow for large ones.
                    </p>
                ) : (
                    <p className="text-xs text-slate-300">
                        <strong>Gradient Descent:</strong> Minimizing {lossType} with {regType} regularization.
                        {lossType === 'MAE' && " MAE is robust to outliers because it uses the sign of the error, not the square."}
                        {regType === 'L2' && " L2 Penalty forces weights to be small."}
                        {regType === 'L1' && " L1 Penalty creates sparse models."}
                    </p>
                )}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Current Model</p>
                  <MathDisplay formula={`\\hat{y} = ${formatCompact(w)}x + ${formatCompact(b)}`} />
                  <p className="text-xs text-slate-500 mb-1 mt-2">Loss Function</p>
                  <MathDisplay formula={getFormula()} className="text-yellow-400"/>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
