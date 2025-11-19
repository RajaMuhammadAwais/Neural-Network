



/**
 * A lightweight Matrix/Vector math library mimicking basic NumPy functionality
 * to ensure mathematical transparency in the simulator.
 */

// Linear Congruential Generator for Reproducible Randomness
class Random {
    private seed: number;
    constructor(seed: number = 12345) { this.seed = seed; }
    
    // LCG Parameters (glibc)
    next(): number {
        this.seed = (1103515245 * this.seed + 12345) % 2147483648;
        return this.seed / 2147483648;
    }

    nextGaussian(): number {
        const u = 1 - this.next();
        const v = this.next();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    setSeed(s: number) { this.seed = s; }
}

export const rng = new Random();

export class Matrix {
    data: number[][];
    rows: number;
    cols: number;

    constructor(rows: number, cols: number, initialValue: number | number[][] = 0) {
        this.rows = Math.max(0, Math.floor(rows));
        this.cols = Math.max(0, Math.floor(cols));
        
        if (Array.isArray(initialValue)) {
            // Validate and deep copy array
            this.data = Array(this.rows).fill(0).map((_, i) => {
                const sourceRow = initialValue[i];
                if (Array.isArray(sourceRow)) {
                    // Copy up to cols elements, fill rest with 0 if missing
                    const newRow = Array(this.cols).fill(0);
                    for(let j=0; j<this.cols; j++) {
                        newRow[j] = sourceRow[j] !== undefined ? sourceRow[j] : 0;
                    }
                    return newRow;
                } else {
                    // Fallback if row missing or invalid, creates a safe row of 0s
                    return Array(this.cols).fill(0);
                }
            });
        } else {
            const val = initialValue as number;
            // Always create full structure even if empty to prevent undefined access
            this.data = Array(this.rows).fill(0).map(() => Array(this.cols).fill(val));
        }
    }

    static random(rows: number, cols: number, scale = 0.1): Matrix {
        const data = Array(Math.floor(rows)).fill(0).map(() => 
            Array(Math.floor(cols)).fill(0).map(() => (rng.next() * 2 - 1) * scale)
        );
        return new Matrix(rows, cols, data);
    }

    // Gaussian random for Xavier/He Initialization
    static randomNormal(rows: number, cols: number, mean = 0, std = 1): Matrix {
        const data = Array(Math.floor(rows)).fill(0).map(() => 
            Array(Math.floor(cols)).fill(0).map(() => {
                const z = rng.nextGaussian();
                return z * std + mean;
            })
        );
        return new Matrix(rows, cols, data);
    }

    // Element-wise addition
    add(other: Matrix | number): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const val = typeof other === 'number' ? other : (other.data[i] ? other.data[i][j] : 0);
                if (this.data[i])
                   result.data[i][j] = this.data[i][j] + val;
            }
        }
        return result;
    }

    // Element-wise subtraction
    subtract(other: Matrix | number): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const val = typeof other === 'number' ? other : (other.data[i] ? other.data[i][j] : 0);
                if (this.data[i])
                   result.data[i][j] = this.data[i][j] - val;
            }
        }
        return result;
    }

    // Element-wise multiplication (Hadamard product) or Scalar multiply
    multiply(other: Matrix | number): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const val = typeof other === 'number' ? other : (other.data[i] ? other.data[i][j] : 0);
                if (this.data[i])
                   result.data[i][j] = this.data[i][j] * val;
            }
        }
        return result;
    }
    
    multiplyScalar(scalar: number): Matrix {
        return this.multiply(scalar);
    }

    // Element-wise division
    divide(other: Matrix | number): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const val = typeof other === 'number' ? other : (other.data[i] ? other.data[i][j] : 0);
                if (this.data[i]) {
                    if (val === 0) result.data[i][j] = 0; // Safety
                    else result.data[i][j] = this.data[i][j] / val;
                }
            }
        }
        return result;
    }

    // Element-wise square root
    sqrt(): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.data[i])
                    result.data[i][j] = Math.sqrt(this.data[i][j]);
            }
        }
        return result;
    }

    // Element-wise square (for L2 Regularization)
    square(): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if(this.data[i])
                   result.data[i][j] = this.data[i][j] * this.data[i][j];
            }
        }
        return result;
    }

    // Sum of all elements
    sum(): number {
        let s = 0;
        for (let i = 0; i < this.rows; i++) {
            if(!this.data[i]) continue;
            for (let j = 0; j < this.cols; j++) {
                s += this.data[i][j];
            }
        }
        return s;
    }

    // Matrix multiplication (Dot product)
    dot(other: Matrix): Matrix {
        // Warn but try to handle mismatch if possible or just return empty result
        if (this.cols !== other.rows) {
            console.warn(`Shape mismatch in dot: ${this.rows}x${this.cols} vs ${other.rows}x${other.cols}`);
            // Return correctly sized zero matrix based on outer dimensions
            return new Matrix(this.rows, other.cols, 0);
        }
        const result = new Matrix(this.rows, other.cols);
        for (let i = 0; i < this.rows; i++) {
            const rowData = this.data[i];
            // Safety check for missing row data
            if (!rowData) continue; 
            
            for (let j = 0; j < other.cols; j++) {
                let sum = 0;
                for (let k = 0; k < this.cols; k++) {
                    const otherRow = other.data[k];
                    // Strict check for other row existence
                    if (otherRow && otherRow[j] !== undefined) {
                         sum += rowData[k] * otherRow[j];
                    }
                }
                // Double safety: ensure result row exists
                if(result.data[i] !== undefined) result.data[i][j] = sum;
            }
        }
        return result;
    }

    transpose(): Matrix {
        const result = new Matrix(this.cols, this.rows);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if(result.data[j] && this.data[i])
                   result.data[j][i] = this.data[i][j];
            }
        }
        return result;
    }

    // Map function for activation functions
    map(fn: (val: number) => number): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.data[i])
                   result.data[i][j] = fn(this.data[i][j]);
            }
        }
        return result;
    }

    // Row-wise Softmax (for Attention)
    softmax(): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for(let i=0; i<this.rows; i++) {
            if (!this.data[i]) continue;
            
            let maxVal = -Infinity;
            for(let j=0; j<this.cols; j++) maxVal = Math.max(maxVal, this.data[i][j]);
            
            let sum = 0;
            const exps = [];
            for(let j=0; j<this.cols; j++) {
                const e = Math.exp(this.data[i][j] - maxVal); // Stability
                exps.push(e);
                sum += e;
            }
            for(let j=0; j<this.cols; j++) {
                if (result.data[i])
                   result.data[i][j] = exps[j] / sum;
            }
        }
        return result;
    }
    
    toArray(): number[] {
        const arr = [];
        for(let i=0; i<this.rows; i++) {
            for(let j=0; j<this.cols; j++) {
                if (this.data[i])
                   arr.push(this.data[i][j]);
            }
        }
        return arr;
    }
}

// "np" object to mimic Python/NumPy syntax in the simulator code
export const np = {
    seed: (val: number) => rng.setSeed(val),
    dot: (a: Matrix, b: Matrix) => a.dot(b),
    add: (a: Matrix, b: Matrix | number) => a.add(b),
    subtract: (a: Matrix, b: Matrix | number) => a.subtract(b),
    divide: (a: Matrix, b: Matrix | number) => a.divide(b),
    transpose: (a: Matrix) => a.transpose(),
    multiply: (a: Matrix, val: Matrix | number) => a.multiply(val),
    sqrt: (a: Matrix) => a.sqrt(),
    square: (a: Matrix) => a.square(),
    sum: (a: Matrix) => a.sum(),
    randomNormal: (r: number, c: number, m: number, s: number) => Matrix.randomNormal(r, c, m, s),
    zeros: (r: number, c: number) => new Matrix(r, c, 0),
    
    // Helper to find index of max element in array
    argmax: (arr: number[]) => {
        if (!arr || arr.length === 0) return 0;
        let max = -Infinity;
        let idx = 0;
        for(let i=0; i<arr.length; i++) {
            if(arr[i] > max) { max = arr[i]; idx = i; }
        }
        return idx;
    },
    
    // Activation Functions
    sigmoid: (z: Matrix) => z.map(x => 1 / (1 + Math.exp(-x))),
    sigmoidPrime: (a: Matrix) => a.map(x => x * (1 - x)), // derivative given activation
    
    relu: (z: Matrix) => z.map(x => Math.max(0, x)),
    reluPrime: (z: Matrix) => z.map(x => x > 0 ? 1 : 0), // derivative given Z
    
    tanh: (z: Matrix) => z.map(x => Math.tanh(x)),
    tanhPrime: (a: Matrix) => a.map(x => 1 - x * x), // derivative given activation (tanh(x))
    
    softmax: (z: Matrix) => z.softmax(),

    // Loss Functions
    meanSquaredError: (yTrue: Matrix, yPred: Matrix): number => {
        let sum = 0;
        const n = yTrue.rows * yTrue.cols;
        for(let i=0; i<yTrue.rows; i++) {
            const v1 = yTrue.data[i] ? yTrue.data[i][0] : 0;
            const v2 = yPred.data[i] ? yPred.data[i][0] : 0;
            sum += Math.pow(v1 - v2, 2);
        }
        return sum / n;
    },
    
    binaryCrossEntropy: (yTrue: Matrix, yPred: Matrix): number => {
        let sum = 0;
        const m = yTrue.rows;
        const epsilon = 1e-15; // prevent log(0)
        for(let i=0; i<m; i++) {
            const y = yTrue.data[i] ? yTrue.data[i][0] : 0;
            const yP = yPred.data[i] ? yPred.data[i][0] : 0;
            const yHat = Math.min(Math.max(yP, epsilon), 1 - epsilon);
            sum += (y * Math.log(yHat) + (1 - y) * Math.log(1 - yHat));
        }
        return -sum / m;
    }
};
