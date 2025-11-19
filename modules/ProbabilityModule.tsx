import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { MathDisplay } from '../components/MathDisplay';
import { Dna, Play, RotateCcw } from 'lucide-react';

export const ProbabilityModule: React.FC = () => {
  const [bins, setBins] = useState<number[]>(new Array(11).fill(0)); // Sum of 2 dice (2 to 12) -> Index 0 to 10
  const [totalRolls, setTotalRolls] = useState(0);
  const [isAutoRolling, setIsAutoRolling] = useState(false);
  const intervalRef = useRef<number>(0);

  const roll = () => {
    // Simulate rolling two dice
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    
    // Update Bins (Sum 2 is index 0, Sum 12 is index 10)
    setBins(prev => {
        const newBins = [...prev];
        newBins[sum - 2]++;
        return newBins;
    });
    setTotalRolls(prev => prev + 1);
  };

  useEffect(() => {
      if (isAutoRolling) {
          intervalRef.current = window.setInterval(() => {
              // Roll multiple times per frame for speed
              for(let i=0; i<5; i++) roll();
          }, 20);
      }
      return () => clearInterval(intervalRef.current);
  }, [isAutoRolling]);

  const chartData = bins.map((count, i) => ({
      sum: i + 2,
      count: count,
      probability: totalRolls > 0 ? (count / totalRolls) : 0
  }));
  
  // Theoretical probability for sum of 2 dice
  // 2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:5, 9:4, 10:3, 11:2, 12:1 (Total 36)
  const idealDist = [1,2,3,4,5,6,5,4,3,2,1].map(x => x/36);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
       <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                 <Dna className="text-indigo-400"/> Central Limit Theorem
             </h2>
             <p className="text-sm text-slate-400 mb-4">
                 Simulating rolling two dice. As the number of rolls increases, the distribution of sums approaches a Normal (Gaussian) distribution.
             </p>
             <div className="grid grid-cols-2 gap-2">
                 <button 
                     onClick={() => setIsAutoRolling(!isAutoRolling)}
                     className={`py-3 rounded-lg font-bold text-white transition-colors ${isAutoRolling ? 'bg-red-500' : 'bg-indigo-600'}`}
                 >
                     {isAutoRolling ? "Stop" : "Auto Roll"}
                 </button>
                 <button 
                     onClick={roll}
                     className="py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
                 >
                     Roll Once
                 </button>
             </div>
             <button 
                 onClick={() => { setBins(new Array(11).fill(0)); setTotalRolls(0); setIsAutoRolling(false); }}
                 className="w-full mt-2 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2"
             >
                 <RotateCcw size={16}/> Reset
             </button>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30">
             <h3 className="text-sm font-semibold text-indigo-400 mb-3">Probability Theory</h3>
             <MathDisplay formula="P(X=x) \approx \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{1}{2}(\frac{x-\mu}{\sigma})^2}" className="text-xs"/>
             <p className="text-xs text-slate-500 mt-2">
                 The Central Limit Theorem states that the sum of independent random variables tends toward a normal distribution (Bell Curve), regardless of the original distribution.
             </p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg text-center">
              <h4 className="text-slate-400 text-xs uppercase tracking-wider">Total Samples</h4>
              <p className="text-4xl font-mono font-bold text-white mt-2">{totalRolls}</p>
          </div>
       </div>

       <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 h-[500px] relative">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis dataKey="sum" stroke="#94a3b8" label={{ value: 'Sum of Dice', position: 'insideBottom', offset: -10 }} />
                 <YAxis stroke="#94a3b8" />
                 <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                 />
                 <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`rgba(99, 102, 241, ${0.5 + (entry.probability * 3)})`} />
                    ))}
                 </Bar>
              </BarChart>
           </ResponsiveContainer>
           <p className="absolute top-4 right-4 text-xs text-slate-500">Experimental Distribution</p>
       </div>
    </div>
  );
};