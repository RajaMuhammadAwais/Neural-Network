

import React, { useState, useMemo, useEffect } from 'react';
import { Matrix } from '../utils/math';
import { MathDisplay } from '../components/MathDisplay';
import { Grid3X3, Eye, Zap, ArrowDown, Filter, FastForward, MousePointerClick, Scan } from 'lucide-react';

export const CNNModule: React.FC = () => {
  const [gridMode, setGridMode] = useState<'simple' | 'mnist'>('simple');
  // Dynamic Grid State
  const [inputGrid, setInputGrid] = useState<number[][]>([]);

  useEffect(() => {
      // Initialize Grid based on mode
      if (gridMode === 'simple') {
          setInputGrid([
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 0],
            [0, 1, 0, 0, 1, 0],
            [0, 1, 0, 0, 1, 0],
            [0, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0]
          ]);
      } else {
          // 14x14 Blank Grid for drawing
          const size = 14;
          const grid = Array(size).fill(0).map(() => Array(size).fill(0));
          setInputGrid(grid);
      }
  }, [gridMode]);

  // 3x3 Kernel
  const [kernel, setKernel] = useState<number[][]>([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ]); 

  const [hoveredCell, setHoveredCell] = useState<{r: number, c: number, type: 'conv' | 'pool'} | null>(null);
  const [showPooling, setShowPooling] = useState(false);
  const [stride, setStride] = useState(1);

  // Toggle Pixel
  const togglePixel = (r: number, c: number) => {
      const newGrid = [...inputGrid];
      if (!newGrid[r]) return; // Safety check
      newGrid[r] = [...newGrid[r]];
      // In MNIST mode, make it "brush" like
      if (gridMode === 'mnist') {
           newGrid[r][c] = 1;
           // Simple brush effect
           if(r+1 < newGrid.length && newGrid[r+1]) newGrid[r+1][c] = Math.max(newGrid[r+1][c], 0.5);
           if(r-1 >= 0 && newGrid[r-1]) newGrid[r-1][c] = Math.max(newGrid[r-1][c], 0.5);
           if(newGrid[r] && c+1 < newGrid[0].length) newGrid[r][c+1] = Math.max(newGrid[r][c+1], 0.5);
           if(newGrid[r] && c-1 >= 0) newGrid[r][c-1] = Math.max(newGrid[r][c-1], 0.5);
      } else {
           newGrid[r][c] = newGrid[r][c] === 0 ? 1 : 0;
      }
      setInputGrid(newGrid);
  };

  const clearGrid = () => {
      if(gridMode === 'simple') {
          setInputGrid([
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 0],
            [0, 1, 0, 0, 1, 0],
            [0, 1, 0, 0, 1, 0],
            [0, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0]
          ]);
      } else {
          setInputGrid(Array(14).fill(0).map(() => Array(14).fill(0)));
      }
  };

  // Apply Convolution
  const featureMap = useMemo(() => {
    if (!inputGrid || inputGrid.length === 0) return [];
    const inRows = inputGrid.length;
    const inCols = inputGrid[0]?.length || 0;
    if (inCols === 0) return [];

    if (!kernel || kernel.length === 0) return [];
    const kRows = kernel.length;
    // Safe access for kernel cols
    const kCols = kernel[0]?.length || 0;
    if (kCols === 0) return [];
    
    const outRows = Math.floor((inRows - kRows) / stride) + 1;
    const outCols = Math.floor((inCols - kCols) / stride) + 1;
    
    if (outRows <= 0 || outCols <= 0) return [];

    // Initialize output array safely
    const output: number[][] = [];
    for(let i=0; i<outRows; i++) output.push(Array(outCols).fill(0));

    for(let i=0; i<outRows; i++) {
      for(let j=0; j<outCols; j++) {
        let sum = 0;
        const startR = i * stride;
        const startC = j * stride;
        for(let ki=0; ki<kRows; ki++) {
          for(let kj=0; kj<kCols; kj++) {
             const rIdx = startR + ki;
             const cIdx = startC + kj;
             if (inputGrid[rIdx] && inputGrid[rIdx][cIdx] !== undefined && kernel[ki] && kernel[ki][kj] !== undefined)
                sum += inputGrid[rIdx][cIdx] * kernel[ki][kj];
          }
        }
        if(output[i]) output[i][j] = sum;
      }
    }
    return output;
  }, [inputGrid, kernel, stride]);

  // Apply Max Pooling (2x2, stride 2)
  const pooledMap = useMemo(() => {
      if (!showPooling || !featureMap || featureMap.length === 0) return [];
      const inRows = featureMap.length; 
      const inCols = featureMap[0]?.length || 0; 
      if (inCols === 0) return [];

      const outRows = Math.floor(inRows / 2);
      const outCols = Math.floor(inCols / 2);
      
      if (outRows <= 0 || outCols <= 0) return [];

      const output: number[][] = [];
      for(let i=0; i<outRows; i++) output.push(Array(outCols).fill(0));
      
      for(let i=0; i<outRows; i++) {
          for(let j=0; j<outCols; j++) {
              let maxVal = -Infinity;
              for(let r=0; r<2; r++) {
                  for(let c=0; c<2; c++) {
                      const rIdx = i * 2 + r;
                      const cIdx = j * 2 + c;
                      if(featureMap[rIdx] && featureMap[rIdx][cIdx] !== undefined) {
                        maxVal = Math.max(maxVal, featureMap[rIdx][cIdx]);
                      }
                  }
              }
              if(output[i]) output[i][j] = maxVal === -Infinity ? 0 : maxVal;
          }
      }
      return output;
  }, [featureMap, showPooling]);

  const applyPreset = (type: string) => {
    switch(type) {
      case 'edge': setKernel([[-1,-1,-1], [-1,8,-1], [-1,-1,-1]]); break;
      case 'sobel_v': setKernel([[-1,0,1], [-2,0,2], [-1,0,1]]); break;
      case 'sobel_h': setKernel([[-1,-2,-1], [0,0,0], [1,2,1]]); break;
      case 'blur': setKernel([[0.1,0.1,0.1], [0.1,0.1,0.1], [0.1,0.1,0.1]]); break;
    }
  };

  const getColor = (val: number) => {
    const clamped = Math.max(-1, Math.min(1, val / 4));
    if (clamped > 0) return `rgba(59, 130, 246, ${clamped})`; 
    if (clamped < 0) return `rgba(239, 68, 68, ${Math.abs(clamped)})`; 
    return 'rgba(30, 41, 59, 0.5)';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
      {/* Controls */}
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            <Grid3X3 className="text-indigo-400"/> CNN Research Lab
          </h2>
          
          <div className="space-y-6">
              <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setGridMode('simple')} className={`py-2 text-xs rounded border ${gridMode === 'simple' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>Simple (6x6)</button>
                      <button onClick={() => setGridMode('mnist')} className={`py-2 text-xs rounded border ${gridMode === 'mnist' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>Real World (14x14)</button>
                  </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2 font-semibold">1. Select Filter</p>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => applyPreset('edge')} className="p-2 bg-slate-700 rounded hover:bg-indigo-600 text-xs transition-colors">Outline</button>
                    <button onClick={() => applyPreset('sobel_v')} className="p-2 bg-slate-700 rounded hover:bg-indigo-600 text-xs transition-colors">Vertical Edges</button>
                    <button onClick={() => applyPreset('sobel_h')} className="p-2 bg-slate-700 rounded hover:bg-indigo-600 text-xs transition-colors">Horizontal Edges</button>
                    <button onClick={() => applyPreset('blur')} className="p-2 bg-slate-700 rounded hover:bg-indigo-600 text-xs transition-colors">Blur</button>
                </div>
              </div>

              <div>
                 <p className="text-sm text-slate-400 mb-2 flex justify-between font-semibold">
                    <span>2. Stride: {stride}</span>
                    <FastForward size={16} className="text-yellow-400"/>
                 </p>
                 <input type="range" min="1" max="2" step="1" value={stride} onChange={(e) => setStride(parseInt(e.target.value))} className="w-full accent-yellow-500" />
              </div>

              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-400 font-semibold">3. Pooling Layer</p>
                    <button onClick={() => setShowPooling(!showPooling)} className={`px-3 py-1 text-xs rounded-full font-bold transition-colors ${showPooling ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {showPooling ? "ON" : "OFF"}
                    </button>
                </div>
            </div>
            
            <button onClick={clearGrid} className="w-full py-2 bg-slate-700 rounded text-xs text-slate-300 hover:bg-slate-600">Clear Grid</button>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="lg:col-span-2 flex flex-col gap-4 items-center justify-center bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Input Grid (Clickable) */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Input</span>
            <div 
              className="grid gap-1 bg-slate-900 p-2 rounded border border-slate-600 shadow-lg"
              style={{ gridTemplateColumns: `repeat(${inputGrid.length}, minmax(0, 1fr))` }}
            >
              {inputGrid.map((row, r) => row.map((val, c) => {
                let isReceptiveField = false;
                if (hoveredCell && hoveredCell.type === 'conv') {
                  const { r: hr, c: hc } = hoveredCell;
                  const startR = hr * stride;
                  const startC = hc * stride;
                  if (r >= startR && r < startR + 3 && c >= startC && c < startC + 3) isReceptiveField = true;
                }
                return (
                  <button 
                    key={`in-${r}-${c}`}
                    onMouseDown={() => togglePixel(r, c)}
                    onMouseEnter={(e) => { if(e.buttons === 1) togglePixel(r, c); }}
                    className={`flex items-center justify-center text-xs transition-all ${gridMode === 'simple' ? 'w-8 h-8 md:w-10 md:h-10' : 'w-3 h-3 md:w-4 md:h-4'} ${isReceptiveField ? 'ring-2 ring-yellow-400 z-10' : ''}`}
                    style={{ backgroundColor: val > 0 ? `rgba(255, 255, 255, ${val})` : '#1e293b' }}
                  />
                );
              }))}
            </div>
          </div>

          <div className="text-slate-500 text-xl"><Zap className="rotate-90 text-indigo-500"/></div>

          {/* Feature Map */}
          <div className="flex flex-col items-center gap-2">
             <span className="text-xs font-bold text-slate-400 uppercase">Feature Map</span>
             <div 
               className="grid gap-1 bg-slate-900 p-2 rounded border border-slate-600"
               style={{ gridTemplateColumns: `repeat(${featureMap[0]?.length || 1}, minmax(0, 1fr))` }}
               onMouseLeave={() => setHoveredCell(null)}
             >
               {featureMap.map((row, r) => row.map((val, c) => {
                  let isPooled = false;
                  if (showPooling && hoveredCell && hoveredCell.type === 'pool') {
                      const { r: pr, c: pc } = hoveredCell;
                      if (r >= pr*2 && r < pr*2+2 && c >= pc*2 && c < pc*2+2) isPooled = true;
                  }
                  return (
                     <div 
                       key={`out-${r}-${c}`}
                       onMouseEnter={() => setHoveredCell({r, c, type: 'conv'})}
                       className={`flex items-center justify-center text-xs font-mono border cursor-crosshair transition-all ${gridMode === 'simple' ? 'w-10 h-10' : 'w-4 h-4 text-[6px]'} ${isPooled ? 'ring-1 ring-green-400 z-10' : 'border-slate-700/50 hover:border-white'}`}
                       style={{ backgroundColor: getColor(val) }}
                     >
                       {gridMode === 'simple' && val.toFixed(0)}
                     </div>
                  );
               }))}
             </div>
          </div>

          {/* Pooled Map */}
          {showPooling && pooledMap.length > 0 && (
              <>
                <div className="text-slate-500 text-xl"><Filter className="rotate-90 text-green-500"/></div>
                <div className="flex flex-col items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-500">
                    <span className="text-xs font-bold text-slate-400 uppercase">Pooled</span>
                    <div 
                        className="grid gap-1 bg-slate-900 p-2 rounded border border-slate-600"
                        style={{ gridTemplateColumns: `repeat(${pooledMap[0]?.length || 1}, minmax(0, 1fr))` }}
                        onMouseLeave={() => setHoveredCell(null)}
                    >
                        {pooledMap.map((row, r) => row.map((val, c) => (
                            <div key={`pool-${r}-${c}`} onMouseEnter={() => setHoveredCell({r, c, type: 'pool'})}
                            className={`flex items-center justify-center font-bold font-mono border border-slate-700/50 cursor-crosshair hover:border-white transition-colors bg-slate-800 text-white ${gridMode === 'simple' ? 'w-12 h-12 text-sm' : 'w-5 h-5 text-[8px]'}`}>
                            {val.toFixed(0)}
                            </div>
                        )))}
                    </div>
                </div>
              </>
          )}
        </div>
      </div>
    </div>
  );
};
