
import React, { useState } from 'react';
import { LinearRegressionModule } from './modules/LinearRegression';
import { NeuralNetworkModule } from './modules/NeuralNetwork';
import { CalculusModule } from './modules/CalculusModule';
import { MultivariableModule } from './modules/MultivariableModule';
import { ProbabilityModule } from './modules/ProbabilityModule';
import { CNNModule } from './modules/CNNModule';
import { TransformerModule } from './modules/TransformerModule';
import { ClusteringModule } from './modules/ClusteringModule';
import { SVMModule } from './modules/SVMModule';
import { ReinforcementModule } from './modules/ReinforcementModule';
import { Activity, TrendingUp, BrainCircuit, Sigma, Mountain, Dna, Grid3X3, Grip, ShieldCheck, Gamepad2 } from 'lucide-react';
import { AIHelper } from './components/AIHelper';

enum ActiveModule {
  LINEAR = 'linear',
  NEURAL = 'neural',
  SVM = 'svm',
  CALCULUS = 'calculus',
  MULTIVARIABLE = 'multivariable',
  PROBABILITY = 'probability',
  CNN = 'cnn',
  TRANSFORMER = 'transformer',
  CLUSTERING = 'clustering',
  REINFORCEMENT = 'reinforcement'
}

function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>(ActiveModule.NEURAL);

  const renderModule = () => {
    switch(activeModule) {
      
      case ActiveModule.LINEAR: return <LinearRegressionModule />;
      case ActiveModule.NEURAL: return <NeuralNetworkModule />;
      case ActiveModule.SVM: return <SVMModule />;
      case ActiveModule.CALCULUS: return <CalculusModule />;
      case ActiveModule.MULTIVARIABLE: return <MultivariableModule />;
      case ActiveModule.PROBABILITY: return <ProbabilityModule />;
      case ActiveModule.CNN: return <CNNModule />;
      case ActiveModule.TRANSFORMER: return <TransformerModule />;
      case ActiveModule.CLUSTERING: return <ClusteringModule />;
      case ActiveModule.REINFORCEMENT: return <ReinforcementModule />;
      default: return <LinearRegressionModule />;
    }
  };

  const getTitle = () => {
     switch(activeModule) {
      case ActiveModule.LINEAR: return { title: 'Linear Regression', subtitle: 'Supervised Learning Foundations' };
      case ActiveModule.NEURAL: return { title: 'Neural Networks', subtitle: 'Deep Learning Lab & Backpropagation' };
      case ActiveModule.SVM: return { title: 'Support Vector Machine', subtitle: 'Max Margin Classification & Kernels' };
      case ActiveModule.CALCULUS: return { title: 'Calculus', subtitle: 'Derivatives & Rates of Change' };
      case ActiveModule.MULTIVARIABLE: return { title: 'Multivariable Calculus', subtitle: 'Optimization & Gradient Descent' };
      case ActiveModule.PROBABILITY: return { title: 'Probability', subtitle: 'Distributions & Central Limit Theorem' };
      case ActiveModule.CNN: return { title: 'Convolutional Neural Networks', subtitle: 'Computer Vision & Feature Extraction' };
      case ActiveModule.TRANSFORMER: return { title: 'Transformers (Attention)', subtitle: 'Natural Language Processing & LLMs' };
      case ActiveModule.CLUSTERING: return { title: 'K-Means Clustering', subtitle: 'Unsupervised Learning & Pattern Recognition' };
      case ActiveModule.REINFORCEMENT: return { title: 'Reinforcement Learning', subtitle: 'Q-Learning & Agent Navigation' };
      default: return { title: '', subtitle: '' };
     }
  };

  const { title, subtitle } = getTitle();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-10 overflow-y-auto shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
            <Activity className="w-6 h-6" /> NeuralVis
          </h1>
          <p className="text-xs text-slate-500 mt-1">AI Research Simulator</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          

          

          <button
            onClick={() => setActiveModule(ActiveModule.SVM)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.SVM
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Support Vector Machine</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule(ActiveModule.NEURAL)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.NEURAL
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <BrainCircuit className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Neural Network</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule(ActiveModule.CNN)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.CNN
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Convolution (CNN)</div>
            </div>
          </button>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2 px-2">Advanced & Unsupervised</div>

          <button
            onClick={() => setActiveModule(ActiveModule.REINFORCEMENT)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.REINFORCEMENT
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Reinforcement Learning</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule(ActiveModule.TRANSFORMER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.TRANSFORMER
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">NLP & Transformers</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule(ActiveModule.CLUSTERING)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.CLUSTERING
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Grip className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Unsupervised (K-Means)</div>
            </div>
          </button>


          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2 px-2">Mathematics</div>
          
          <button
            onClick={() => setActiveModule(ActiveModule.CALCULUS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.CALCULUS
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Sigma className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Calculus</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule(ActiveModule.MULTIVARIABLE)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.MULTIVARIABLE
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Mountain className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Multivariable</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule(ActiveModule.PROBABILITY)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeModule === ActiveModule.PROBABILITY
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Dna className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Probability</div>
            </div>
          </button>

        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto relative min-h-screen">
        <header className="mb-6 shrink-0">
          <h2 className="text-3xl font-light text-white">
            {title}
          </h2>
          <p className="text-slate-400 mt-2 max-w-2xl">
            {subtitle}
          </p>
        </header>

        <div className="pb-20">
          {renderModule()}
        </div>

        {/* Context-Aware AI Helper */}
        <AIHelper 
          moduleName={title}
          contextData={JSON.stringify({ activeModule, time: Date.now() })} 
        />
      </main>
    </div>
  );
}

export default App;
