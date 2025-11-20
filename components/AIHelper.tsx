// import React, { useState } from 'react';
// import { GoogleGenAI } from '@google/genai';
// import { MessageCircle, X, Loader2, Sparkles } from 'lucide-react';

// interface AIHelperProps {
//   contextData: string; // Stringified JSON of current model state (loss, epoch, etc)
//   moduleName: string;
// }

// export const AIHelper: React.FC<AIHelperProps> = ({ contextData, moduleName }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [response, setResponse] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleAsk = async () => {
//     if (!process.env.API_KEY) {
//       setError("API Key not configured.");
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
//       const prompt = `
//         You are a helpful AI Tutor for a Machine Learning Simulator.
//         The user is currently studying the "${moduleName}" module.
        
//         Current Simulation State:
//         ${contextData}
        
//         Please explain clearly and briefly (under 100 words) what is happening mathematically right now based on the current loss and epoch. 
//         If the loss is high, explain why. If it's converging, congratulate them. 
//         Explain the core concept simply.
//       `;

//       const result = await ai.models.generateContent({
//         model: 'gemini-2.5-flash',
//         contents: prompt,
//       });
      
//       setResponse(result.text);
//     } catch (err) {
//       setError("Failed to get AI response. Please check configuration.");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed bottom-6 right-6 z-50">
//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center group"
//         >
//           <Sparkles className="w-6 h-6 group-hover:animate-spin" />
//         </button>
//       )}

//       {isOpen && (
//         <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-80 flex flex-col overflow-hidden">
//           <div className="bg-indigo-600 p-3 flex justify-between items-center">
//             <h3 className="text-white font-semibold flex items-center gap-2">
//               <Sparkles className="w-4 h-4" /> Gemini Tutor
//             </h3>
//             <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white">
//               <X className="w-5 h-5" />
//             </button>
//           </div>
          
//           <div className="p-4 text-sm text-slate-300 min-h-[150px] max-h-[300px] overflow-y-auto">
//             {!response && !loading && !error && (
//               <p>Click below to get an analysis of your current training run.</p>
//             )}
//             {loading && (
//               <div className="flex flex-col items-center justify-center py-8 text-indigo-400">
//                 <Loader2 className="w-8 h-8 animate-spin mb-2" />
//                 <span>Thinking...</span>
//               </div>
//             )}
//             {error && <p className="text-red-400">{error}</p>}
//             {response && <p className="leading-relaxed">{response}</p>}
//           </div>

//           <div className="p-3 bg-slate-900 border-t border-slate-700">
//             <button
//               onClick={handleAsk}
//               disabled={loading}
//               className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white py-2 px-4 rounded transition-colors text-sm font-medium"
//             >
//               {response ? "Analyze Again" : "Explain Current State"}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
