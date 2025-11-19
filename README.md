# NeuralVis: Advanced AI Research Simulator

**NeuralVis** is a high-performance, web-based interactive laboratory designed to bridge the gap between high-level Artificial Intelligence theory and mathematical intuition. Unlike standard "black box" ML libraries, NeuralVis exposes the raw calculus, linear algebra, and probability statistics driving modern algorithms in real-time.

Designed for **Researchers, Data Scientists, and Students**, it offers a "Glass Box" approach to AI, allowing for rigorous hypothesis testing, algorithm comparison, and deep diagnostic analysis.

---

## 🔬 Core Philosophy: The "Scientist Mode"

This is not just a toy visualization. It is built with **Scientific Rigor** in mind:

*   **Reproducibility**: All random number generation is handled by a seeded Linear Congruential Generator (LCG). Setting `Seed: 12345` guarantees the exact same data distribution and weight initialization every time, allowing for valid A/B testing of hyperparameters.
*   **Deep Diagnostics**: We don't just show "Loss". We visualize **Gradient Flow** (to detect vanishing gradients), **Weight Distributions** (to check initialization), **Residual Plots** (to validate regression assumptions), and **Confusion Matrices**.
*   **Mathematical Transparency**: Every major operation is accompanied by its LaTeX equation, rendered dynamically based on current parameters.

---

## 🧠 Simulation Modules

### 1. Supervised Learning Foundations
*   **Linear Regression Lab**:
    *   **Solvers**: Switch between Iterative **Gradient Descent** and the analytical **Normal Equation** ($\theta = (X^TX)^{-1}X^Ty$).
    *   **Loss Landscape**: Real-time 3D-simulated heatmap of the Cost Function with trajectory tracking.
    *   **Robustness**: Test **L1 (Lasso)** vs **L2 (Ridge)** regularization and **MAE** vs **MSE** loss functions against outliers.
    *   **Diagnostics**: Residual vs. Fitted plots to detect heteroscedasticity.

*   **Support Vector Machines (SVM)**:
    *   **Max Margin**: Visualizes the "street" between classes, highlighting **Support Vectors**.
    *   **Hinge Loss**: Watch the optimization process minimize classification error while maximizing geometric margin.

### 2. Deep Learning & Neural Networks
*   **Multilayer Perceptron (MLP)**:
    *   **Topology**: Dynamic architecture (add/remove neurons) to test model capacity.
    *   **Backpropagation**: Visualizes the decision boundary warping space in real-time.
    *   **Optimizers**: Compare convergence speeds of **SGD**, **Momentum**, and **Adam**.
    *   **Lab Notebook**: log experiments to compare F1-Scores and Test Accuracy across runs.

*   **Convolutional Neural Networks (CNN)**:
    *   **Interactive Vision**: Draw on a grid (or use MNIST mode) and watch kernels slide over pixels.
    *   **Feature Maps**: Visualize the dot-product "Receptive Field" and the effect of **Stride** and **Max Pooling**.
    *   **Filters**: Apply Sobel, Edge Detection, and Blur kernels.

### 3. Advanced Architectures
*   **Transformers (Self-Attention)**:
    *   **Attention Mechanism**: A visual calculator for the $Attention(Q, K, V)$ formula.
    *   **Heatmaps**: Interactive matrix showing token-to-token relationships (how "Bank" relates to "River").
    *   **Embeddings**: Simulates the projection of Query, Key, and Value matrices.

*   **Reinforcement Learning (RL)**:
    *   **Grid World**: An agent learns to navigate a maze with pits and goals.
    *   **Q-Learning**: Visualizes the **Bellman Equation** updates in real-time.
    *   **Policy Map**: Heatmap and vector field showing the agent's learned strategy ($\pi^*$).

### 4. Unsupervised Learning
*   **K-Means Clustering**:
    *   **Voronoi Tesselation**: Watch centroids migrate and partition the space iteratively.
    *   **Expectation-Maximization**: Step-by-step visualization of the Assignment and Update phases.

### 5. Mathematical Foundations
*   **Calculus**: Interactive Derivative visualization with tangent lines.
*   **Multivariable Optimization**: Gradient Descent on 3D surfaces (Convex Bowls vs. Saddle Points).
*   **Probability**: Central Limit Theorem simulation using virtual dice rolls.

---

## 🛠 Technology Stack

*   **Frontend Engine**: React 19 (TypeScript) for component architecture.
*   **Visualization**: 
    *   **Recharts**: Statistical plotting (Scatter, Line, Bar charts).
    *   **D3.js**: Network topology and complex SVG manipulations.
    *   **HTML5 Canvas**: High-performance rendering for Decision Boundaries and Loss Landscapes.
*   **Math Engine**: Custom lightweight `numpy`-like linear algebra library (`utils/math.ts`) for transparent matrix operations.
*   **Equation Rendering**: **KaTeX** for high-fidelity LaTeX typesetting.
*   **AI Integration**:  for the context-aware AI Tutor.
*   **Styling**: Tailwind CSS for a responsive, dark-mode "Dashboard" aesthetic.

---

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/neuralvis.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
  
    ```
4.  **Run the simulator**:
    ```bash
    npm start
    ```

## 🤝 Contributing

This project is designed to be extensible. Researchers are encouraged to add new modules (e.g., GANs, PCA, RNNs). Please submit a Pull Request with your math logic in `utils/math.ts` and the visual component in `modules/`.

---

*Built with ❤️ for the AI Research Community.*
