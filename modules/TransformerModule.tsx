
import React, { useState, useEffect, useMemo } from 'react';
import { Matrix, np } from '../utils/math';
import { MathDisplay } from '../components/MathDisplay';
import { Sparkles, MessageSquare, Network } from 'lucide-react';

export const TransformerModule: React.FC = () => {
  const [inputText, setInputText] = useState("The bank of the river");
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const embedDim = 4;
  
  // Simulate Projection Matrices (Fixed for stability in demo)
  const Wq = useMemo(() => Matrix.randomNormal(embedDim, embedDim, 0, 0.5), []);
  const Wk = useMemo(() => Matrix.randomNormal(embedDim, embedDim, 0, 0.5), []);
  
  useEffect(() => {
    setTokens(inputText.split(' ').filter(t => t.length > 0));
  }, [inputText]);

  // 1. Mock Embeddings (In real world, these come from pre-trained tables)
  const embeddings = useMemo(() => {
    const mat = Matrix.randomNormal(tokens.length, embedDim, 0, 1);
    return mat;
  }, [tokens]);

  // 2. Compute Q and K
  const Q = useMemo(() => np.dot(embeddings, Wq), [embeddings, Wq]);
  const K = useMemo(() => np.dot(embeddings, Wk), [embeddings, Wk]);

  // 3. Compute Attention Scores: Softmax(Q * K^T / sqrt(d))
  const attentionScores = useMemo(() => {
      if (tokens.length === 0) return new Matrix(0,0);
      const Kt = np.transpose(K);
      const dot = np.dot(Q, Kt);
      const scaled = np.multiply(dot, 1 / Math.sqrt(embedDim));
      return np.softmax(scaled);
  }, [Q, K, tokens]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
      <div className="space-y-6">
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <Sparkles className="text-indigo-400"/> Self-Attention
            </h2>
            <div className="space-y-4">
               <div>
                   <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Input Sentence</label>
                   <input 
                     type="text" 
                     value={inputText} 
                     onChange={(e) => setInputText(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white font-mono"
                   />
               </div>
               <p className="text-xs text-slate-400">
                   The core of modern LLMs (like GPT). It allows the model to weigh the importance of words relative to each other.
               </p>
            </div>
         </div>
         
         <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30">
             <h3 className="text-sm font-semibold text-indigo-400 mb-3">Mathematical Engine</h3>
             <MathDisplay formula="Attention(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V" />
             <ul className="text-xs text-slate-500 mt-3 space-y-2">
                 <li><strong>Query (Q):</strong> What I am looking for?</li>
                 <li><strong>Key (K):</strong> What I contain?</li>
                 <li><strong>Score:</strong> The dot product $Q \cdot K^T$ measures similarity.</li>
             </ul>
         </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Visualization */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex-1 flex flex-col items-center justify-center">
              <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase flex items-center gap-2">
                  <Network size={16}/> Attention Heatmap
              </h3>
              
              <div className="relative">
                  {/* Heatmap Grid */}
                  <div 
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `30px repeat(${tokens.length}, 50px)` }}
                  >
                      {/* Header Row */}
                      <div className="h-8"></div>
                      {tokens.map((t, i) => (
                          <div key={i} className="h-8 flex items-center justify-center text-xs text-slate-400 font-mono -rotate-45 origin-bottom-left translate-y-2">
                              {t}
                          </div>
                      ))}

                      {/* Rows */}
                      {tokens.map((rowToken, i) => (
                          <React.Fragment key={i}>
                              {/* Row Label */}
                              <div className="flex items-center justify-end pr-2 text-xs text-slate-400 font-mono">{rowToken}</div>
                              
                              {/* Cells */}
                              {tokens.map((colToken, j) => {
                                  const score = attentionScores.data[i][j];
                                  const isHovered = hoveredIndex === i;
                                  return (
                                      <div 
                                        key={`${i}-${j}`}
                                        onMouseEnter={() => setHoveredIndex(i)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                        className={`h-12 w-12 flex items-center justify-center text-[10px] font-bold rounded transition-all cursor-pointer border ${isHovered ? 'border-white scale-110 z-10' : 'border-transparent'}`}
                                        style={{ backgroundColor: `rgba(99, 102, 241, ${score})`, color: score > 0.5 ? 'white' : 'rgba(255,255,255,0.5)' }}
                                      >
                                          {score.toFixed(2)}
                                      </div>
                                  );
                              })}
                          </React.Fragment>
                      ))}
                  </div>
              </div>
              
              <div className="mt-8 p-4 bg-slate-900 rounded border border-slate-700 w-full">
                 <p className="text-xs text-slate-400 mb-2">Interpretation:</p>
                 {hoveredIndex !== null ? (
                     <p className="text-sm text-white">
                         When processing the word <span className="font-bold text-indigo-400">"{tokens[hoveredIndex]}"</span>, 
                         the model pays attention to: <br/>
                         {tokens.map((t, j) => {
                             const s = attentionScores.data[hoveredIndex][j];
                             if (s < 0.1) return null;
                             return <span key={j} className="inline-block mr-2 mt-1 px-2 py-1 rounded bg-indigo-900 border border-indigo-500 text-xs">{t} ({s.toFixed(2)})</span>
                         })}
                     </p>
                 ) : (
                     <p className="text-sm text-slate-500 italic">Hover over a cell or row to see relationships.</p>
                 )}
              </div>
          </div>
      </div>
    </div>
  );
};
