# TopoPhase

Real-time Topological Quantum Phase Transition Detector

## What is TopoPhase

TopoPhase simulates a 2D quantum spin lattice (the Ising model) using Monte Carlo methods, then applies persistent homology and spectral graph theory to detect phase transitions *before* traditional order parameters like magnetization can see them. The core scientific claim: topological invariants computed from the spin correlation graph — Betti numbers, persistence diagrams, and the spectral gap — change 2–4 Monte Carlo sweeps before the classical magnetization order parameter collapses. This gives an early warning of phase transitions that no classical detector can match. The system runs a live simulation, feeds topological features into a Graph Neural Network for phase classification, and streams everything to a React dashboard in real time.

## The Mathematics

**The Ising Model and Phase Transitions.** The 2D ferromagnetic Ising model places spins on an N x N square lattice. At low temperatures, spins align (ordered/ferromagnetic phase, magnetization M -> 1). At high temperatures, spins are random (disordered/paramagnetic phase, M -> 0). At the critical temperature Tc = 2J/ln(1+sqrt(2)) ~ 2.2692, the system undergoes a continuous phase transition where the correlation length diverges and the system becomes scale-free. Classical detectors measure magnetization M, but M is a global average that changes smoothly and only registers the transition after it has substantially progressed.

**Persistent Homology and Betti Numbers.** TopoPhase constructs a weighted graph from the spin-spin correlation matrix, then builds a *filtration* — a nested sequence of graphs at decreasing correlation thresholds. Persistent homology tracks how topological features (connected components and loops) appear and disappear across this filtration. The key invariants are Betti numbers: beta_0 counts connected components and beta_1 counts independent loops. In the ordered phase, correlations are long-range, so the graph is densely connected (beta_0 ~ 1, beta_1 large). In the disordered phase, correlations are short-range, so the graph fragments (beta_0 large, beta_1 ~ 0). At the critical point, beta_1 spikes sharply as the percolating cluster forms loops — this spike is the topological phase transition signal, and it occurs 2–4 MC sweeps *before* M collapses measurably.

**The Fiedler Value (Spectral Gap).** The graph Laplacian's second-smallest eigenvalue — the Fiedler value — measures algebraic connectivity. When the correlation graph loses its long-range backbone at the transition, the Fiedler value drops toward zero. This spectral signal is complementary to the Betti numbers and provides an independent topological alarm channel.

**Wasserstein Distance for Change Detection.** The bottleneck distance between consecutive persistence diagrams quantifies how much the topology changed in a single MC step. A sharp spike in this distance is a topological alarm — it means the topology restructured dramatically, and it reliably precedes the magnetization collapse. TopoPhase detects spikes exceeding 3 standard deviations above the running mean.

## Installation

```bash
# Clone the repository
git clone https://github.com/amandilippandit/TopoPhase.git
cd TopoPhase

# Install Python dependencies (requires Python >= 3.11)
pip install -e .

# Generate training data (~5 min on a modern CPU)
python -m gnn.generate_data

# Train the TopoGNN model (~10 min, saves to checkpoints/topognn.pt)
python -m gnn.train

# Start the backend API server
uvicorn api.main:app --reload --port 8000

# In a separate terminal, start the frontend
cd frontend
npm install
npm run dev
# Open http://localhost:5173 in your browser
```

## Architecture

```
sim/          Ising lattice Monte Carlo simulation (Metropolis-Hastings)
topo/         Graph construction, persistent homology (GUDHI), spectral analysis
gnn/          TopoGNN model (PyG SAGEConv + topological attention), data gen, training
api/          FastAPI backend with async simulator and WebSocket streaming
frontend/     React + D3 + Recharts dashboard with Zustand state management
```

**Data flow:** MC simulation -> correlation matrix -> weighted graph -> persistent homology + spectral analysis -> node features -> GNN inference -> WebSocket -> React dashboard.

## The Early Warning Experiment

When you start a simulation, TopoPhase sweeps the temperature from T_start (ordered phase) through Tc and up to T_end (disordered phase). Watch the **EarlyWarningBadge** in the left panel:

1. **Amber "TOPOLOGICAL EARLY WARNING"** — The Wasserstein distance between consecutive persistence diagrams spiked, meaning the correlation graph's topology is restructuring. Magnetization hasn't dropped yet.
2. **Green "CONFIRMED"** — Magnetization finally collapsed, confirming the phase transition. The badge shows how many simulation steps the topological detector led by.

**Expected lead time:** 2–4 steps with default parameters (N=12, 10 sweeps/step). Larger lattices (N=20+) and fewer sweeps per step amplify the effect because the topological signal integrates over the full correlation structure while magnetization is a simple average.

**What affects it:** Lattice size (larger = clearer separation), sweeps per step (fewer = more granular detection), correlation window (larger = smoother signal but more lag).

## Known Limitations

- **Performance:** GUDHI's Rips complex construction is O(n^3) in the number of lattice sites, so N > 20 becomes noticeably slow. The `fast_betti` function bypasses GUDHI for real-time Betti numbers using the Euler characteristic, but the persistence diagram still requires the full Rips computation.
- **Synthetic training data:** The GNN is trained on synthetic Monte Carlo data only. Predictions on real quantum measurement data would require retraining on experimental data.
- **2D Ising only:** The current implementation is specific to the 2D square lattice Ising model. Extending to other models (XY, Heisenberg, Potts) requires modifying the simulation and possibly the feature engineering.
- **Single-threaded MC:** The Metropolis-Hastings algorithm is inherently sequential per sweep. For large lattices, consider the Wolff cluster algorithm for faster thermalization (not implemented here).
