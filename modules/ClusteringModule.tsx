
import React, { useState, useRef, useEffect } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { MathDisplay } from '../components/MathDisplay';
import { Grip, Play, PlusCircle, RefreshCw } from 'lucide-react';

interface Point { x: number; y: number; cluster?: number; }

export const ClusteringModule: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [centroids, setCentroids] = useState<Point[]>([]);
  const [k, setK] = useState(3);
  const [iteration, setIteration] = useState(0);
  const [isConverged, setIsConverged] = useState(false);

  // Init random data
  useEffect(() => {
      const init = [];
      for(let i=0; i<50; i++) {
          init.push({ x: Math.random()*100, y: Math.random()*100 });
      }
      setPoints(init);
  }, []);

  const initCentroids = () => {
      const newCentroids = [];
      // Pick K random points as initial centroids
      for(let i=0; i<k; i++) {
          newCentroids.push({ x: Math.random()*100, y: Math.random()*100, cluster: i });
      }
      setCentroids(newCentroids);
      setIteration(0);
      setIsConverged(false);
      
      // Reset point assignments
      setPoints(pts => pts.map(p => ({ ...p, cluster: undefined })));
  };

  const step = () => {
      if (centroids.length === 0) { initCentroids(); return; }

      // 1. Assign Points to Nearest Centroid
      let changed = false;
      const newPoints = points.map(p => {
          let minDist = Infinity;
          let cIdx = -1;
          centroids.forEach((c, idx) => {
              const dist = Math.sqrt(Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2));
              if (dist < minDist) {
                  minDist = dist;
                  cIdx = idx;
              }
          });
          if (p.cluster !== cIdx) changed = true;
          return { ...p, cluster: cIdx };
      });

      // 2. Move Centroids to Mean
      const newCentroids = centroids.map((c, idx) => {
          const clusterPoints = newPoints.filter(p => p.cluster === idx);
          if (clusterPoints.length === 0) return c;
          
          const avgX = clusterPoints.reduce((s, p) => s + p.x, 0) / clusterPoints.length;
          const avgY = clusterPoints.reduce((s, p) => s + p.y, 0) / clusterPoints.length;
          return { x: avgX, y: avgY, cluster: idx };
      });

      setPoints(newPoints);
      setCentroids(newCentroids);
      setIteration(it => it + 1);
      if (!changed && iteration > 0) setIsConverged(true);
  };

  const handleAddPoint = (e: any) => {
      // Safety check: Ensure payload exists and has data before accessing index 0
      if (e && e.activeCoordinate && e.activePayload && e.activePayload.length > 0) {
          setPoints([...points, { x: e.activeLabel, y: e.activePayload[0].value }]); 
      } else if (e && e.activeCoordinate) {
          // Fallback if payload is missing but coordinate exists (unlikely for scatter but safe)
           setPoints([...points, { x: Math.random()*100, y: Math.random()*100 }]);
      }
  };
  
  const addRandomPoint = () => {
      setPoints([...points, { x: Math.random()*100, y: Math.random()*100 }]);
      setIsConverged(false);
  };

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
       <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                 <Grip className="text-indigo-400"/> K-Means Clustering
             </h2>
             <div className="space-y-4">
                 <div>
                     <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Clusters (K): {k}</label>
                     <input type="range" min="2" max="5" value={k} onChange={(e) => { setK(parseInt(e.target.value)); initCentroids(); }} className="w-full accent-indigo-500"/>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={step} disabled={isConverged} className="flex-1 py-2 bg-indigo-600 rounded text-white font-bold disabled:opacity-50 disabled:bg-green-600">
                         {isConverged ? "Converged!" : centroids.length === 0 ? "Start" : "Next Step"}
                     </button>
                     <button onClick={initCentroids} className="px-3 bg-slate-700 rounded text-white"><RefreshCw size={18}/></button>
                 </div>
                 <button onClick={addRandomPoint} className="w-full py-2 border border-slate-600 text-slate-400 rounded hover:bg-slate-700 flex items-center justify-center gap-2">
                     <PlusCircle size={16}/> Add Data Point
                 </button>
             </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30">
             <h3 className="text-sm font-semibold text-indigo-400 mb-3">Unsupervised Learning</h3>
             <p className="text-xs text-slate-500 mb-2">
                 The algorithm partitions data into K clusters by minimizing the variance within each cluster.
             </p>
             <MathDisplay formula="J = \sum_{i=1}^{k} \sum_{x \in S_i} ||x - \mu_i||^2" className="text-xs"/>
             <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                 <div className="bg-slate-800 p-2 rounded">
                     <span className="block text-xs text-slate-500">Points</span>
                     <span className="font-mono font-bold text-white">{points.length}</span>
                 </div>
                 <div className="bg-slate-800 p-2 rounded">
                     <span className="block text-xs text-slate-500">Iterations</span>
                     <span className="font-mono font-bold text-white">{iteration}</span>
                 </div>
             </div>
          </div>
       </div>

       <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 h-[500px] relative">
           <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} onClick={handleAddPoint}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                 <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                 <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                 <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}/>
                 
                 {/* Data Points */}
                 <Scatter data={points} shape="circle">
                     {points.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.cluster !== undefined ? colors[entry.cluster] : '#94a3b8'} />
                     ))}
                 </Scatter>

                 {/* Centroids */}
                 <Scatter data={centroids} shape="cross" r={10}>
                     {centroids.map((entry, index) => (
                         <Cell key={`cent-${index}`} stroke={colors[entry.cluster || 0]} strokeWidth={4} />
                     ))}
                 </Scatter>
              </ScatterChart>
           </ResponsiveContainer>
           {centroids.length === 0 && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="bg-black/70 px-4 py-2 rounded text-white">Click "Start" to initialize K-Means</div>
               </div>
           )}
       </div>
    </div>
  );
};
