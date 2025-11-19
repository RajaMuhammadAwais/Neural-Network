
/**
 * A lightweight Matrix/Vector math library mimicking basic NumPy functionality
 * to ensure mathematical transparency in the simulator.
 */

export class Matrix {
    data: number[][];
    rows: number;
    cols: number;

    constructor(rows: number, cols: number, initialValue: number | number[][] = 0) {
        this.rows = rows;
        this.cols = cols;
        if (Array.isArray(initialValue)) {
            // Deep copy if array is passed to prevent reference issues
            this.data = initialValue.map(row => [...row]);
        } else {
            this.data = Array(rows).fill(0).map(() => Array(cols).fill(initialValue as number));
        }
    }

    static random(rows: number, cols: number, scale = 0.1): Matrix {
        const data = Array(rows).fill(0).map(() => 
            Array(cols).fill(0).map(() => (Math.random() * 2 - 1) * scale)
        );
        return new Matrix(rows, cols, data);
    }

    // Gaussian random for Xavier/He Initialization
    static randomNormal(rows: number, cols: number, mean = 0, std = 1): Matrix {
        const data = Array(rows).fill(0).map(() => 
            Array(cols).fill(0).map(() => {
                const u = 1 - Math.random();
                const v = Math.random();
                const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
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
                const val = typeof other === 'number' ? other : other.data[i][j];
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
                const val = typeof other === 'number' ? other : other.data[i][j];
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
                const val = typeof other === 'number' ? other : other.data[i][j];
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
                const val = typeof other === 'number' ? other : other.data[i][j];
                if (val === 0) result.data[i][j] = 0; // Safety
                else result.data[i][j] = this.data[i][j] / val;
            }
        }
        return result;
    }

    // Element-wise square root
    sqrt(): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
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
                result.data[i][j] = this.data[i][j] * this.data[i][j];
            }
        }
        return result;
    }

    // Sum of all elements
    sum(): number {
        let s = 0;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                s += this.data[i][j];
            }
        }
        return s;
    }

    // Matrix multiplication (Dot product)
    dot(other: Matrix): Matrix {
        if (this.cols !== other.rows) {
            throw new Error(`Shape mismatch: ${this.rows}x${this.cols} vs ${other.rows}x${other.cols}`);
        }
        const result = new Matrix(this.rows, other.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < other.cols; j++) {
                let sum = 0;
                for (let k = 0; k < this.cols; k++) {
                    sum += this.data[i][k] * other.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        return result;
    }

    transpose(): Matrix {
        const result = new Matrix(this.cols, this.rows);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
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
                result.data[i][j] = fn(this.data[i][j]);
            }
        }
        return result;
    }

    // Row-wise Softmax (for Attention)
    softmax(): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for(let i=0; i<this.rows; i++) {
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
                result.data[i][j] = exps[j] / sum;
            }
        }
        return result;
    }
}

// "np" object to mimic Python/NumPy syntax in the simulator code
export const np = {
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
            sum += Math.pow(yTrue.data[i][0] - yPred.data[i][0], 2);
        }
        return sum / n;
    },
    
    binaryCrossEntropy: (yTrue: Matrix, yPred: Matrix): number => {
        let sum = 0;
        const m = yTrue.rows;
        const epsilon = 1e-15; // prevent log(0)
        for(let i=0; i<m; i++) {
            const y = yTrue.data[i][0];
            const yHat = Math.min(Math.max(yPred.data[i][0], epsilon), 1 - epsilon);
            sum += (y * Math.log(yHat) + (1 - y) * Math.log(1 - yHat));
        }
        return -sum / m;
    }
};
