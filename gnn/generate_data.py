"""Generate synthetic labelled dataset for training the TopoGNN."""

import os

import numpy as np
import torch

from gnn.features import build_node_features, build_pyg_data
from sim.correlations import compute_correlation_matrix
from sim.lattice import IsingLattice
from topo.graph_builder import build_graph
from topo.homology import compute_persistence
from topo.spectral import fiedler_value

TC = 2.2692


def main() -> None:
    N = 10
    temperatures = np.linspace(0.5, 5.0, 60)
    n_samples_per_temp = 5

    dataset: list = []
    labels_count = {0: 0, 1: 0, 2: 0}

    for t_idx, T in enumerate(temperatures):
        if T < TC - 0.3:
            label = 0  # ordered
        elif abs(T - TC) <= 0.3:
            label = 1  # critical
        else:
            label = 2  # disordered

        print(
            f"[{t_idx + 1}/{len(temperatures)}] T={T:.3f}, "
            f"label={['ordered', 'critical', 'disordered'][label]}"
        )

        lattice = IsingLattice(N=N, T=T, seed=42 + t_idx)
        lattice.thermalize(n_sweeps=2000)

        for sample in range(n_samples_per_temp):
            spin_history = []
            for _ in range(50):
                spins = lattice.step(n_sweeps=1)
                spin_history.append(spins)

            current_spins = spin_history[-1]
            C = compute_correlation_matrix(spin_history)
            graph = build_graph(C, threshold=0.01)
            simplex_tree = compute_persistence(graph)
            fiedler = fiedler_value(graph)
            features = build_node_features(graph, current_spins, simplex_tree, fiedler)
            data = build_pyg_data(graph, features, label=label)
            data.magnetization = torch.tensor(
                [lattice.magnetization()], dtype=torch.float32
            )
            data.temperature = torch.tensor([T], dtype=torch.float32)

            dataset.append(data)
            labels_count[label] += 1

    os.makedirs("data", exist_ok=True)
    torch.save(dataset, "data/phase_dataset.pt")

    print(f"\nDataset saved to data/phase_dataset.pt")
    print(f"Total samples: {len(dataset)}")
    print(f"Class distribution: ordered={labels_count[0]}, "
          f"critical={labels_count[1]}, disordered={labels_count[2]}")
    if dataset:
        print(f"Feature shape per sample: {dataset[0].x.shape}")


if __name__ == "__main__":
    main()
