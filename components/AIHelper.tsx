import React, { useState } from 'react';
import { MessageCircle, X, Loader2, Sparkles } from 'lucide-react';

interface AIHelperProps {
  contextData: string;
  moduleName: string;
}

export const AIHelper: React.FC<AIHelperProps> = ({ contextData, moduleName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    try {
      let summary = '';
      try {
        const parsed = JSON.parse(contextData);
        const mod = parsed.activeModule ?? moduleName;
        summary = `You are viewing "${mod}". Focus on the core idea; inspect parameters and outputs to see how changes affect training.`;
      } catch {
        summary = `Module "${moduleName}". Review the relationships between inputs, parameters and outputs.`;
      }
      // Simulate brief thinking delay to keep UI consistent
      await new Promise(r => setTimeout(r, 300));
      setResponse(summary);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center group"
        >
          <Sparkles className="w-6 h-6 group-hover:animate-spin" />
        </button>
      )}

      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-80 flex flex-col overflow-hidden">
          <div className="bg-indigo-600 p-3 flex justify-between items-center">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Tutor
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 text-sm text-slate-300 min-h-[150px] max-h-[300px] overflow-y-auto">
            {!response && !loading && (
              <p>Click below for a brief explanation tailored to the current module.</p>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span>Thinking...</span>
              </div>
            )}
            {response && <p className="leading-relaxed">{response}</p>}
          </div>

          <div className="p-3 bg-slate-900 border-t border-slate-700">
            <button
              onClick={handleExplain}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white py-2 px-4 rounded transition-colors text-sm font-medium"
            >
              {response ? "Explain Again" : "Explain Current State"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
