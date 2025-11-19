import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, Area } from 'recharts';
import { MathDisplay } from '../components/MathDisplay';
import { Sigma, TrendingUp } from 'lucide-react';

export const CalculusModule: React.FC = () => {
  const [xVal, setXVal] = useState(1);
  
  // Function: f(x) = x^3 - 4x
  const f = (x: number) => Math.pow(x, 3) - 4 * x;
  
  // Derivative (Analytical): f'(x) = 3x^2 - 4
  const df = (x: number) => 3 * Math.pow(x, 2) - 4;

  // Generate curve data
  const data = useMemo(() => {
    const points = [];
    for (let x = -3; x <= 3; x += 0.1) {
      points.push({ x: Number(x.toFixed(1)), y: f(x) });
    }
    return points;
  }, []);

  // Calculate Tangent Line at xVal
  // y - y1 = m(x - x1) => y = m(x - xVal) + yVal
  const slope = df(xVal);
  const yVal = f(xVal);
  
  const tangentData = [
    { x: xVal - 1, y: slope * ((xVal - 1) - xVal) + yVal },
    { x: xVal + 1, y: slope * ((xVal + 1) - xVal) + yVal }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
             <TrendingUp className="text-indigo-400"/> Derivatives
          </h2>
          <div className="space-y-6">
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Input (x): {xVal.toFixed(2)}</label>
               <input 
                 type="range" min="-2.5" max="2.5" step="0.1" 
                 value={xVal}
                 onChange={(e) => setXVal(parseFloat(e.target.value))}
                 className="w-full accent-indigo-500"
               />
             </div>
             <div className="bg-slate-900 p-4 rounded-lg">
               <div className="flex justify-between mb-2">
                 <span className="text-slate-400">Function Value f(x):</span>
                 <span className="text-white font-mono">{yVal.toFixed(3)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-400">Slope f'(x):</span>
                 <span className={`${slope > 0 ? 'text-green-400' : 'text-red-400'} font-mono`}>{slope.toFixed(3)}</span>
               </div>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30">
            <h3 className="text-sm font-semibold text-indigo-400 mb-3">Definition of Derivative</h3>
            <div className="space-y-3">
              <MathDisplay formula="f(x) = x^3 - 4x" />
              <MathDisplay formula="f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}" />
              <MathDisplay formula="f'(x) = 3x^2 - 4" className="text-green-400"/>
              <p className="text-xs text-slate-500 mt-2">
                The derivative represents the instantaneous rate of change, visually represented as the slope of the tangent line (red) at point x.
              </p>
            </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 h-[500px]">
         <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
               <XAxis dataKey="x" type="number" domain={[-3, 3]} allowDataOverflow stroke="#94a3b8" />
               <YAxis type="number" domain={[-10, 10]} allowDataOverflow stroke="#94a3b8"/>
               <Tooltip 
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
               />
               <Line data={data} dataKey="y" stroke="#818cf8" strokeWidth={3} dot={false} type="monotone" />
               
               {/* Tangent Line Visualization */}
               <Line 
                 data={tangentData} 
                 dataKey="y" 
                 stroke="#ef4444" 
                 strokeWidth={2} 
                 dot={false} 
                 isAnimationActive={false} 
               />
               <ReferenceDot x={xVal} y={yVal} r={6} fill="#ef4444" stroke="white" />
            </LineChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};