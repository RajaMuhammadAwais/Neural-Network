
export interface Point {
    x: number;
    y: number;
    label?: number; // 0 or 1 for classification
}

export enum ModuleType {
    LINEAR_REGRESSION = 'LINEAR_REGRESSION',
    NEURAL_NETWORK = 'NEURAL_NETWORK',
    SVM = 'SVM', // New
    CALCULUS = 'CALCULUS',
    MULTIVARIABLE = 'MULTIVARIABLE',
    PROBABILITY = 'PROBABILITY',
    CNN = 'CNN',
    TRANSFORMER = 'TRANSFORMER',
    CLUSTERING = 'CLUSTERING',
    REINFORCEMENT = 'REINFORCEMENT' // New
}

export interface SimulationState {
    epoch: number;
    loss: number;
    isPlaying: boolean;
    learningRate: number;
}

export type ActivationFunction = 'sigmoid' | 'relu' | 'tanh';
export type Optimizer = 'SGD' | 'Momentum' | 'Adam';

export interface ExperimentRecord {
    id: number;
    activation: string;
    learningRate: number;
    regularization: number;
    hiddenNeurons: number;
    optimizer?: Optimizer;
    finalLoss: number;
    testAccuracy: number;
    f1Score?: number;
    dataset: string;
}
