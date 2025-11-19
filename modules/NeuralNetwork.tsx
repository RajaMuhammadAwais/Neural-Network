




// ... imports same as before ...

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Matrix, np } from '../utils/math';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Cell, Tooltip, Legend, LineChart, Line, BarChart, Bar } from 'recharts';
import { MathDisplay } from '../components/MathDisplay';
import { Play, Pause, SkipForward, RefreshCw, Layers, ShieldCheck, AlertTriangle, Settings2, FlaskConical, Save, BookOpen, Trash2, Zap, Activity, Gauge, ZoomIn, Grid, Microscope } from 'lucide-react';
import { select } from 'd3';
import { ExperimentRecord, Optimizer } from '../types';

type ActivationType = 'tanh' | 'relu' | 'sigmoid';
type DataType = 'circle' | 'xor' | 'spiral';

export const NeuralNetworkModule: React.FC = () => {
  // ... State ...
  const [allData, setAllData] = useState<{x: number, y: number, label: number, isTest: boolean}[]>([]);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(0);
  const [testAccuracy, setTestAccuracy] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [confusionMatrix, setConfusionMatrix] = useState({ tp: 0, tn: 0, fp: 0, fn: 0 });
  const [f1Score, setF1Score] = useState(0);
  
  // Hyperparameters
  const [learningRate, setLearningRate] = useState(0.05);
  const [regLambda, setRegLambda] = useState(0.001);
  const [activation, setActivation] = useState<ActivationType>('tanh');
  const [hiddenSize, setHiddenSize] = useState(4); // Dynamic Topology
  const [dataType, setDataType] = useState<DataType>('circle');
  const [optimizer, setOptimizer] = useState<Optimizer>('SGD');
  const [seed, setSeed] = useState(12345);

  // New Simulation Controls
  const [speed, setSpeed] = useState(1); // Steps per frame
  const [zoom, setZoom] = useState(1);
  const [dataDensity, setDataDensity] = useState(100);

  // Diagnostics
  const [gradHistory, setGradHistory] = useState<{epoch: number, layer1: number, layer2: number}[]>([]);
  const [weightDist, setWeightDist] = useState<{bin: string, count: number}[]>([]);
  const [activeTab, setActiveTab] = useState<'visuals' | 'diagnostics'>('visuals');

  // Lab Notebook
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  // --- Model Architecture ---
  const inputSize = 2;
  const outputSize = 1;

  // Weights Refs
  const W1 = useRef<Matrix>(new Matrix(2, 4)); 
  const b1 = useRef<Matrix>(new Matrix(1, 4));
  const W2 = useRef<Matrix>(new Matrix(4, 1));
  const b2 = useRef<Matrix>(new Matrix(1, 1));

  // Optimizer State (Momentum/Adam)
  const optState = useRef<{
      mW1: Matrix, mb1: Matrix, mW2: Matrix, mb2: Matrix,
      vW1: Matrix, vb1: Matrix, vW2: Matrix, vb2: Matrix,
      t: number
  }>({
      mW1: new Matrix(0,0), mb1: new Matrix(0,0), mW2: new Matrix(0,0), mb2: new Matrix(0,0),
      vW1: new Matrix(0,0), vb1: new Matrix(0,0), vW2: new Matrix(0,0), vb2: new Matrix(0,0),
      t: 0
  });

  // ... (generateData, resetModel, handleHiddenSizeChange same as before) ...
  const generateData = useCallback(() => {
    np.seed(seed); // Reproducibility
    const points = [];
    const N = dataDensity; // Use customizable density
    const splitIdx = Math.floor(N * 0.8); 

    if (dataType === 'circle') {
        for(let i=0; i<N; i++) {
            // Fix: Correct parameters for randomNormal (rows, cols, mean, std) -> (1, 1, 0, 1)
            const r = np.randomNormal(1, 1, 0, 1).data[0][0] * 0.5; // Seeded
            const theta = Math.random() * 2 * Math.PI; 
            points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), label: 0, isTest: i >= splitIdx });
        }
        for(let i=0; i<N; i++) {
            const r = 0.8 + Math.random() * 0.4;
            const theta = Math.random() * 2 * Math.PI;
            points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), label: 1, isTest: i >= splitIdx });
        }
    } else if (dataType === 'xor') {
        for(let i=0; i<N*1.5; i++) {
            const x = (Math.random() * 2 - 1);
            const y = (Math.random() * 2 - 1);
            const label = (x > 0 && y > 0) || (x < 0 && y < 0) ? 0 : 1;
            points.push({ x: x + (Math.random()*0.1), y: y + (Math.random()*0.1), label, isTest: i >= splitIdx * 1.5 });
        }
    } else if (dataType === 'spiral') {
        for (let i = 0; i < N; i++) {
            const r = i / N * 1.2 + 0.2;
            const t = 1.75 * i / N * 2 * Math.PI;
            points.push({
                x: r * Math.sin(t) + (Math.random() * 0.05),
                y: r * Math.cos(t) + (Math.random() * 0.05),
                label: 0, isTest: i >= splitIdx
            });
            points.push({
                x: r * Math.sin(t + Math.PI) + (Math.random() * 0.05),
                y: r * Math.cos(t + Math.PI) + (Math.random() * 0.05),
                label: 1, isTest: i >= splitIdx
            });
        }
    }
    setAllData(points);
    resetModel(activation, hiddenSize);
  }, [dataType, dataDensity, seed]);

  const resetModel = (actType: ActivationType, hSize: number) => {
    np.seed(seed + 1); // Different seed for weights
    if (actType === 'relu') {
        const std = Math.sqrt(2 / inputSize);
        W1.current = np.randomNormal(inputSize, hSize, 0, std);
        W2.current = np.randomNormal(hSize, outputSize, 0, Math.sqrt(2/hSize));
    } else {
        const std = Math.sqrt(1 / inputSize);
        W1.current = np.randomNormal(inputSize, hSize, 0, std);
        W2.current = np.randomNormal(hSize, outputSize, 0, Math.sqrt(1/hSize));
    }
    b1.current = new Matrix(1, hSize);
    b2.current = new Matrix(1, outputSize);
    
    // Reset Optimizer State
    optState.current = {
        mW1: np.zeros(inputSize, hSize), mb1: np.zeros(1, hSize), mW2: np.zeros(hSize, outputSize), mb2: np.zeros(1, outputSize),
        vW1: np.zeros(inputSize, hSize), vb1: np.zeros(1, hSize), vW2: np.zeros(hSize, outputSize), vb2: np.zeros(1, outputSize),
        t: 0
    };

    setEpoch(0);
    setLoss(1);
    setTestAccuracy(0);
    setF1Score(0);
    setConfusionMatrix({ tp: 0, tn: 0, fp: 0, fn: 0 });
    setGradHistory([]);
    setWeightDist([]);
    setIsPlaying(false);
    
    setTimeout(() => {
        drawNetwork(hSize);
        drawDecisionBoundary();
        updateWeightHist();
    }, 50);
  };

  const handleHiddenSizeChange = (newSize: number) => {
      setHiddenSize(newSize);
      resetModel(activation, newSize);
  };

  useEffect(() => { generateData(); }, [generateData]);

  // ... (applyOptimizer same as before) ...
  const applyOptimizer = (
      param: Matrix, grad: Matrix, 
      m: Matrix, v: Matrix, 
      beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8
  ): { newParam: Matrix, newM: Matrix, newV: Matrix } => {
      
      if (optimizer === 'SGD') {
          return { 
              newParam: np.subtract(param, np.multiply(grad, learningRate)), 
              newM: m, newV: v 
          };
      }
      else if (optimizer === 'Momentum') {
          const newVelocity = np.add(np.multiply(m, 0.9), np.multiply(grad, learningRate));
          const newParam = np.subtract(param, newVelocity);
          return { newParam, newM: newVelocity, newV: v };
      }
      else if (optimizer === 'Adam') {
          const t = optState.current.t;
          const newM = np.add(np.multiply(m, beta1), np.multiply(grad, 1 - beta1));
          const newV = np.add(np.multiply(v, beta2), np.multiply(grad.square(), 1 - beta2));
          
          const mHat = np.divide(newM, 1 - Math.pow(beta1, t));
          const vHat = np.divide(newV, 1 - Math.pow(beta2, t));
          
          const denom = np.add(vHat.sqrt(), epsilon);
          const update = np.divide(np.multiply(mHat, learningRate), denom);
          
          return { newParam: np.subtract(param, update), newM: newM, newV: newV };
      }
      return { newParam: param, newM: m, newV: v };
  };

  // ... (computeGradientStep same as before) ...
  const computeGradientStep = (dataPoints: typeof allData): { loss: number, g1: number, g2: number } => {
     const trainData = dataPoints.filter(p => !p.isTest);
     if (trainData.length === 0) return { loss: 0, g1: 0, g2: 0 };
     const m = trainData.length;
     optState.current.t += 1;

     const X = new Matrix(m, 2, trainData.map(p => [p.x, p.y]));
     const Y = new Matrix(m, 1, trainData.map(p => [p.label]));
     const hSize = W1.current.cols; 

     const Z1_data = [];
     const dotXW1 = np.dot(X, W1.current);
     for(let i=0; i<m; i++) {
         const row = [];
         for(let j=0; j<hSize; j++) {
             const rowVal = (dotXW1.data[i] && dotXW1.data[i][j] !== undefined) ? dotXW1.data[i][j] : 0;
             if (b1.current.data && b1.current.data[0] && b1.current.data[0][j] !== undefined) {
                 row.push(rowVal + b1.current.data[0][j]);
             } else {
                 row.push(rowVal);
             }
         }
         Z1_data.push(row);
     }
     const Z1_mat = new Matrix(m, hSize, Z1_data);
     
     let A1: Matrix;
     if (activation === 'relu') A1 = np.relu(Z1_mat);
     else if (activation === 'sigmoid') A1 = np.sigmoid(Z1_mat);
     else A1 = np.tanh(Z1_mat);

     const b2Val = (b2.current.data && b2.current.data[0] && b2.current.data[0][0] !== undefined) ? b2.current.data[0][0] : 0;
     const Z2 = np.add(np.dot(A1, W2.current), b2Val);
     const A2 = np.sigmoid(Z2);

     let currentLoss = np.binaryCrossEntropy(Y, A2);
     currentLoss += (regLambda / (2 * m)) * (W1.current.square().sum() + W2.current.square().sum());

     const dZ2 = np.subtract(A2, Y);
     const dW2 = np.add(np.multiply(np.dot(np.transpose(A1), dZ2), 1/m), np.multiply(W2.current, regLambda/m));
     const db2 = dZ2.sum() / m;

     const dA1 = np.dot(dZ2, np.transpose(W2.current));
     let dAct: Matrix;
     if (activation === 'relu') dAct = np.reluPrime(Z1_mat);
     else if (activation === 'sigmoid') dAct = np.sigmoidPrime(A1);
     else dAct = np.tanhPrime(A1);

     const dZ1 = dA1.multiply(dAct);
     const dW1 = np.add(np.multiply(np.dot(np.transpose(X), dZ1), 1/m), np.multiply(W1.current, regLambda/m));
     
     const db1_data = Array(hSize).fill(0);
     for(let i=0; i<m; i++) {
         if (dZ1.data[i]) {
             for(let j=0; j<hSize; j++) {
                 if (dZ1.data[i][j] !== undefined) db1_data[j] += dZ1.data[i][j];
             }
         }
     }
     const db1 = new Matrix(1, hSize, [db1_data.map(x => x/m)]);

     const upW1 = applyOptimizer(W1.current, dW1, optState.current.mW1, optState.current.vW1);
     W1.current = upW1.newParam; optState.current.mW1 = upW1.newM; optState.current.vW1 = upW1.newV;

     const upW2 = applyOptimizer(W2.current, dW2, optState.current.mW2, optState.current.vW2);
     W2.current = upW2.newParam; optState.current.mW2 = upW2.newM; optState.current.vW2 = upW2.newV;

     const upB1 = applyOptimizer(b1.current, db1, optState.current.mb1, optState.current.vb1);
     b1.current = upB1.newParam; optState.current.mb1 = upB1.newM; optState.current.vb1 = upB1.newV;
     
     const db2Mat = new Matrix(1, 1, [[db2]]);
     const upB2 = applyOptimizer(b2.current, db2Mat, optState.current.mb2, optState.current.vb2);
     b2.current = upB2.newParam; optState.current.mb2 = upB2.newM; optState.current.vb2 = upB2.newV;
     
     const g1 = Math.sqrt(dW1.square().sum() / (dW1.rows * dW1.cols));
     const g2 = Math.sqrt(dW2.square().sum() / (dW2.rows * dW2.cols));

     return { loss: currentLoss, g1, g2 };
  };

  const updateWeightHist = () => {
      const weights = [...W1.current.toArray(), ...W2.current.toArray()];
      const bins = Array(21).fill(0);
      const labels = Array(21).fill(0).map((_, i) => ((i-10)*0.2).toFixed(1));
      weights.forEach(w => {
          const binIdx = Math.min(20, Math.max(0, Math.floor((w + 2) / 0.2)));
          bins[binIdx]++;
      });
      setWeightDist(bins.map((count, i) => ({ bin: labels[i], count })));
  };

  // Metric Calculation Helper - Updated with safer access
  const updateMetrics = () => {
     const testData = allData.filter(p => p.isTest);
     if (testData.length > 0) {
         const X_t = new Matrix(testData.length, 2, testData.map(p => [p.x, p.y]));
         const hSize = W1.current.cols;
         
         const Z1_t_data = [];
         const dotXW1_t = np.dot(X_t, W1.current);
         for(let i=0; i<testData.length; i++) {
             const row = [];
             for(let j=0; j<hSize; j++) {
                 const bias = (b1.current.data && b1.current.data[0] && b1.current.data[0][j] !== undefined) ? b1.current.data[0][j] : 0;
                 const dotVal = (dotXW1_t.data[i] && dotXW1_t.data[i][j] !== undefined) ? dotXW1_t.data[i][j] : 0;
                 row.push(dotVal + bias);
             }
             Z1_t_data.push(row);
         }
         const Z1_t = new Matrix(testData.length, hSize, Z1_t_data);
         let A1_t = activation === 'relu' ? np.relu(Z1_t) : activation === 'sigmoid' ? np.sigmoid(Z1_t) : np.tanh(Z1_t);
         const b2Val = (b2.current.data && b2.current.data[0] && b2.current.data[0][0] !== undefined) ? b2.current.data[0][0] : 0;
         const Z2_t = np.add(np.dot(A1_t, W2.current), b2Val);
         const A2_t = np.sigmoid(Z2_t);

         let tp = 0, tn = 0, fp = 0, fn = 0;
         for(let i=0; i<testData.length; i++) {
             // Strict safety check for row existence
             const predVal = (A2_t.data && A2_t.data[i] && A2_t.data[i][0] !== undefined) ? A2_t.data[i][0] : 0;
             const pred = predVal > 0.5 ? 1 : 0;
             const actual = testData[i].label;
             if (pred === 1 && actual === 1) tp++;
             if (pred === 0 && actual === 0) tn++;
             if (pred === 1 && actual === 0) fp++;
             if (pred === 0 && actual === 1) fn++;
         }
         setConfusionMatrix({ tp, tn, fp, fn });
         const acc = ((tp + tn) / testData.length) * 100;
         const precision = tp / (tp + fp) || 0;
         const recall = tp / (tp + fn) || 0;
         const f1 = 2 * (precision * recall) / (precision + recall) || 0;
         
         setTestAccuracy(acc);
         setF1Score(f1);
     }
  };

  // ... (Animation Loop same as before) ...
  useEffect(() => {
    const animate = () => {
        if (!isPlaying) return;
        
        let lastLoss = 0;
        let g1Sum = 0, g2Sum = 0;
        
        for(let i=0; i<speed; i++) {
            const res = computeGradientStep(allData);
            lastLoss = res.loss;
            g1Sum += res.g1;
            g2Sum += res.g2;
        }
        
        setLoss(lastLoss);
        setEpoch(e => {
            const newE = e + speed;
            setGradHistory(prev => {
                const h = [...prev, { epoch: newE, layer1: g1Sum/speed, layer2: g2Sum/speed }];
                return h.length > 50 ? h.slice(h.length-50) : h; 
            });
            return newE;
        });
        updateMetrics();
        
        if (epoch % 10 === 0) updateWeightHist(); 
        
        drawNetwork(W1.current.cols);
        drawDecisionBoundary();

        requestRef.current = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
    }
    return () => { if(requestRef.current) cancelAnimationFrame(requestRef.current); }
  }, [isPlaying, allData, learningRate, regLambda, activation, optimizer, speed, epoch]);

  // ... (stepForward same as before) ...
  const stepForward = () => {
      const res = computeGradientStep(allData);
      setLoss(res.loss);
      setEpoch(e => e + 1);
      setGradHistory(prev => [...prev, { epoch: epoch+1, layer1: res.g1, layer2: res.g2 }]);
      updateMetrics();
      updateWeightHist();
      drawNetwork(W1.current.cols);
      drawDecisionBoundary();
  };

  // ... (saveExperiment same as before) ...
  const saveExperiment = () => {
      const newRec: ExperimentRecord = {
          id: Date.now(),
          activation,
          learningRate,
          regularization: regLambda,
          hiddenNeurons: hiddenSize,
          optimizer: optimizer,
          finalLoss: loss,
          testAccuracy,
          f1Score,
          dataset: dataType
      };
      setExperiments(prev => [newRec, ...prev]);
  };

  // ... (drawDecisionBoundary same as before) ...
  const drawDecisionBoundary = () => {
      const canvas = heatmapCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      const res = 25;
      const cellW = width / res;
      const cellH = height / res;
      const hSize = W1.current.cols; 
      
      if (!b1.current || b1.current.cols !== hSize) return;

      const bound = 1.5 / zoom;
      
      const inputs = [];
      for(let r=0; r<res; r++) {
          for(let c=0; c<res; c++) {
              const x = ((c/res) * 2 * bound) - bound;
              const y = -(((r/res) * 2 * bound) - bound);
              inputs.push([x, y]);
          }
      }
      const X = new Matrix(inputs.length, 2, inputs);
      const Z1_data = [];
      const dotXW1 = np.dot(X, W1.current);
      for(let i=0; i<dotXW1.rows; i++) {
            const row = [];
            for(let j=0; j<dotXW1.cols; j++) {
                const bias = (b1.current.data && b1.current.data[0] && b1.current.data[0][j] !== undefined) ? b1.current.data[0][j] : 0;
                const dotVal = (dotXW1.data[i] && dotXW1.data[i][j] !== undefined) ? dotXW1.data[i][j] : 0;
                row.push(dotVal + bias);
            }
            Z1_data.push(row);
      }
      const Z1 = new Matrix(inputs.length, hSize, Z1_data);
      let A1 = activation === 'relu' ? np.relu(Z1) : activation === 'sigmoid' ? np.sigmoid(Z1) : np.tanh(Z1);
      const b2Val = (b2.current.data && b2.current.data[0] && b2.current.data[0][0] !== undefined) ? b2.current.data[0][0] : 0;
      const Z2 = np.add(np.dot(A1, W2.current), b2Val);
      const A2 = np.sigmoid(Z2);

      for(let i=0; i<inputs.length; i++) {
          const prob = (A2.data && A2.data[i] && A2.data[i][0] !== undefined) ? A2.data[i][0] : 0.5;
          const r = Math.floor(i/res);
          const c = i%res;
          ctx.fillStyle = prob < 0.5 
            ? `rgba(239, 68, 68, ${0.1 + (1-prob) * 0.5})` 
            : `rgba(59, 130, 246, ${0.1 + prob * 0.5})`;
          ctx.clearRect(c*cellW, r*cellH, cellW, cellH);
          ctx.fillRect(c*cellW, r*cellH, cellW, cellH);
      }
  };

  // ... (drawNetwork same as before) ...
  const drawNetwork = (hSize: number) => {
      if (!svgRef.current) return;
      const svg = select(svgRef.current);
      svg.selectAll("*").remove(); 
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      const nodes: any[] = [];
      const links: any[] = [];
      const layerX = [width * 0.15, width * 0.5, width * 0.85];
      for(let i=0; i<inputSize; i++) nodes.push({ id: `i${i}`, x: layerX[0], y: (height / (inputSize+1)) * (i+1), layer: 0 });
      for(let i=0; i<hSize; i++) nodes.push({ id: `h${i}`, x: layerX[1], y: (height / (hSize+1)) * (i+1), layer: 1 });
      nodes.push({ id: `o0`, x: layerX[2], y: height/2, layer: 2 });
      
      if (W1.current.cols === hSize) {
          for(let i=0; i<inputSize; i++) for(let h=0; h<hSize; h++) {
              const w = (W1.current.data[i] && W1.current.data[i][h] !== undefined) ? W1.current.data[i][h] : 0;
              links.push({ source: nodes[i], target: nodes[inputSize + h], weight: w });
          }
      }
      if (W2.current.rows === hSize) {
          for(let h=0; h<hSize; h++) {
              const w = (W2.current.data[h] && W2.current.data[h][0] !== undefined) ? W2.current.data[h][0] : 0;
              links.push({ source: nodes[inputSize + h], target: nodes[inputSize + hSize], weight: w });
          }
      }

      svg.append("g").selectAll("line").data(links).enter().append("line")
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y)
        .attr("stroke", d => d.weight > 0 ? "#60a5fa" : "#f87171")
        .attr("stroke-width", d => Math.min(Math.abs(d.weight) * 3, 6)).attr("opacity", 0.5);

      const nGroup = svg.append("g");
      nGroup.selectAll("circle").data(nodes).enter().append("circle")
        .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.layer === 1 ? 14 : 10)
        .attr("fill", "#1e293b").attr("stroke", "#94a3b8").attr("stroke-width", 2);
  };

  useEffect(() => { 
      drawNetwork(hiddenSize); 
      drawDecisionBoundary(); 
      updateWeightHist();
  }, []);

  // ... Return JSX ...
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-y-auto">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <FlaskConical className="text-indigo-400"/> Research Lab
            </h2>
            <div className="space-y-5">
                {/* Control Bar */}
                <div className="bg-slate-900 p-3 rounded border border-slate-600 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-2"><Gauge size={14}/> Speed ({speed}x)</label>
                        <input type="range" min="1" max="10" step="1" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-24 accent-indigo-500 h-1"/>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-2"><ZoomIn size={14}/> Zoom ({zoom}x)</label>
                        <input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={(e) => { setZoom(parseFloat(e.target.value)); setTimeout(drawDecisionBoundary, 10); }} className="w-24 accent-indigo-500 h-1"/>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-2"><Grid size={14}/> Density ({dataDensity})</label>
                        <input type="range" min="50" max="500" step="50" value={dataDensity} onChange={(e) => setDataDensity(parseInt(e.target.value))} className="w-24 accent-indigo-500 h-1"/>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-2">Seed: {seed}</label>
                        <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value))} className="w-20 bg-slate-800 text-xs border border-slate-600 rounded px-1 text-white"/>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">1. Data Source</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['circle', 'xor', 'spiral'] as DataType[]).map(type => (
                            <button key={type} onClick={() => setDataType(type)}
                                className={`py-2 text-xs font-bold uppercase rounded border ${dataType === type ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex justify-between">
                        <span>2. Optimizer</span>
                        <Zap size={14} className="text-yellow-400"/>
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                         {(['SGD', 'Momentum', 'Adam'] as Optimizer[]).map(opt => (
                             <button key={opt} onClick={() => { setOptimizer(opt); resetModel(activation, hiddenSize); }}
                                className={`py-1 text-xs font-bold uppercase rounded border ${optimizer === opt ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                                {opt}
                             </button>
                         ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">3. Architecture</label>
                    <div className="flex gap-2 mb-2">
                         {(['relu', 'tanh', 'sigmoid'] as ActivationType[]).map(act => (
                            <button key={act} onClick={() => { setActivation(act); resetModel(act, hiddenSize); }}
                                className={`flex-1 py-1 text-xs font-bold uppercase rounded border ${activation === act ? 'bg-teal-600 border-teal-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                                {act}
                            </button>
                        ))}
                    </div>
                    <input type="range" min="2" max="8" step="1" value={hiddenSize} 
                        onChange={(e) => handleHiddenSizeChange(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Learning Rate</label>
                        <input type="number" step="0.01" value={learningRate} onChange={(e) => setLearningRate(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"/>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">L2 Reg</label>
                        <input type="number" step="0.001" value={regLambda} onChange={(e) => setRegLambda(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"/>
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-2 rounded-lg font-bold transition-colors text-white flex items-center justify-center gap-2 ${isPlaying ? 'bg-yellow-600' : 'bg-green-600'}`}>
                        {isPlaying ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Train</>}
                    </button>
                    <button onClick={stepForward} className="px-3 bg-slate-700 rounded-lg text-white hover:bg-slate-600"><SkipForward size={18}/></button>
                    <button onClick={() => resetModel(activation, hiddenSize)} className="px-3 bg-slate-700 rounded-lg text-white hover:bg-slate-600"><RefreshCw size={18}/></button>
                    <button onClick={saveExperiment} className="px-3 bg-blue-600 rounded-lg text-white hover:bg-blue-500"><Save size={18}/></button>
                </div>
            </div>
        </div>
        
        {/* Metrics Panel */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Activity size={14}/> Evaluation Metrics</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900 p-2 rounded text-center">
                    <div className="text-xs text-slate-500">F1 Score</div>
                    <div className="text-lg font-mono font-bold text-white">{f1Score.toFixed(3)}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded text-center">
                    <div className="text-xs text-slate-500">Test Acc</div>
                    <div className="text-lg font-mono font-bold text-white">{testAccuracy.toFixed(1)}%</div>
                </div>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-slate-700">
                <div className="text-xs text-slate-500 text-center mb-2">Confusion Matrix</div>
                <div className="grid grid-cols-2 gap-1 text-center text-sm">
                     <div className="bg-green-900/30 p-1 rounded border border-green-500/20">
                         <span className="block text-xs text-green-400">True Pos</span>
                         <span className="font-mono font-bold">{confusionMatrix.tp}</span>
                     </div>
                     <div className="bg-red-900/30 p-1 rounded border border-red-500/20">
                         <span className="block text-xs text-red-400">False Pos</span>
                         <span className="font-mono font-bold">{confusionMatrix.fp}</span>
                     </div>
                     <div className="bg-red-900/30 p-1 rounded border border-red-500/20">
                         <span className="block text-xs text-red-400">False Neg</span>
                         <span className="font-mono font-bold">{confusionMatrix.fn}</span>
                     </div>
                     <div className="bg-green-900/30 p-1 rounded border border-green-500/20">
                         <span className="block text-xs text-green-400">True Neg</span>
                         <span className="font-mono font-bold">{confusionMatrix.tn}</span>
                     </div>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="lg:col-span-8 flex flex-col gap-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
             {activeTab === 'visuals' ? (
                 <>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative flex flex-col">
                        <div className="absolute top-2 right-2 flex gap-2 z-10">
                             <button onClick={() => setActiveTab('diagnostics')} className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600" title="Diagnostics"><Microscope size={16}/></button>
                        </div>
                        <svg ref={svgRef} className="w-full flex-1 cursor-crosshair"></svg>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
                        <div className="absolute inset-0 z-0">
                            <canvas ref={heatmapCanvasRef} width={300} height={300} className="w-full h-full opacity-50 blur-[2px]" />
                        </div>
                        <ResponsiveContainer width="100%" height="100%" className="z-10 relative">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="x" type="number" domain={[-1.5/zoom, 1.5/zoom]} hide />
                                <YAxis dataKey="y" type="number" domain={[-1.5/zoom, 1.5/zoom]} hide />
                                <Scatter data={allData} shape={(props: any) => (
                                    <circle cx={props.cx} cy={props.cy} r={(props.payload.isTest ? 4 : 3) * zoom} 
                                        fill={props.payload.label === 0 ? '#ef4444' : '#3b82f6'} 
                                        stroke="white" strokeWidth={props.payload.isTest ? 1.5 : 0} 
                                        fillOpacity={props.payload.isTest ? 0.6 : 1}
                                    />
                                )} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                 </>
             ) : (
                 <>
                     {/* Gradient Flow Chart */}
                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col relative">
                        <div className="absolute top-2 right-2 flex gap-2 z-10">
                             <button onClick={() => setActiveTab('visuals')} className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600" title="Visuals"><Layers size={16}/></button>
                        </div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Gradient Flow (Vanishing Gradient Check)</h3>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={gradHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                                    <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={10}/>
                                    <YAxis stroke="#94a3b8" fontSize={10}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}/>
                                    <Legend />
                                    <Line type="monotone" dataKey="layer1" stroke="#8884d8" dot={false} name="Layer 1 Grad" />
                                    <Line type="monotone" dataKey="layer2" stroke="#82ca9d" dot={false} name="Layer 2 Grad" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                     </div>
                     
                     {/* Weight Histogram */}
                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
                         <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Weight Distribution</h3>
                         <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weightDist}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                                    <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10}/>
                                    <YAxis stroke="#94a3b8" fontSize={10}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}/>
                                    <Bar dataKey="count" fill="#60a5fa" />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                     </div>
                 </>
             )}
         </div>

         <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1 min-h-[200px]">
             <div className="bg-slate-900 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
                 <h3 className="font-bold text-slate-300 flex items-center gap-2"><BookOpen size={16}/> Experiment Log</h3>
                 <button onClick={() => setExperiments([])} className="text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-400">
                     <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-500">
                         <tr>
                             <th className="px-6 py-3">Data</th>
                             <th className="px-6 py-3">Opt</th>
                             <th className="px-6 py-3">Loss</th>
                             <th className="px-6 py-3">Acc</th>
                             <th className="px-6 py-3">F1</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700">
                         {experiments.map((exp) => (
                             <tr key={exp.id} className="hover:bg-slate-700/50">
                                 <td className="px-6 py-3 font-medium text-white">{exp.dataset}</td>
                                 <td className="px-6 py-3 text-xs uppercase">{exp.optimizer}</td>
                                 <td className="px-6 py-3 font-mono">{exp.finalLoss.toFixed(4)}</td>
                                 <td className="px-6 py-3 font-bold text-green-400">{exp.testAccuracy.toFixed(1)}%</td>
                                 <td className="px-6 py-3 font-mono">{exp.f1Score?.toFixed(3)}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         </div>
      </div>
    </div>
  );
};