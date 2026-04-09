"""Build node feature vectors and PyG Data objects for the TopoGNN."""

import gudhi
import networkx as nx
import numpy as np
import torch
from torch_geometric.data import Data

from topo.homology import fast_betti


def _node_max_persistence(
    simplex_tree: gudhi.SimplexTree, node: int, n_nodes: int
) -> float:
    """Find the maximum dim-1 persistence lifetime for features involving a given node."""
    persistence = simplex_tree.persistence()
    intervals_1 = [
        (b, d) for dim, (b, d) in persistence if dim == 1
    ]
    if not intervals_1:
        return 0.0

    node_simplices: set[int] = set()
    for simplex, filt in simplex_tree.get_filtration():
        if node in simplex:
            node_simplices.add(tuple(simplex))

    max_lifetime = 0.0
    for birth, death in intervals_1:
        d = 2.0 if np.isinf(death) else death
        lifetime = d - birth
        if lifetime > max_lifetime:
            max_lifetime = lifetime

    if not node_simplices:
        return 0.0
    return float(max_lifetime) if node_simplices else 0.0


def build_node_features(
    graph: nx.Graph,
    spins: np.ndarray,
    simplex_tree: gudhi.SimplexTree,
    fiedler: float,
) -> np.ndarray:
    """Build the 6-dimensional node feature matrix.

    Feature order: [spin, mean_corr, b0_local, b1_local, persistence, fiedler]

    Parameters
    ----------
    graph : correlation graph with N² nodes.
    spins : (N, N) float32 spin array.
    simplex_tree : persistence-computed SimplexTree.
    fiedler : global Fiedler value.

    Returns
    -------
    features : (N², 6) float32 array.
    """
    n_nodes = graph.number_of_nodes()
    spins_flat = spins.ravel().astype(np.float32)
    features = np.zeros((n_nodes, 6), dtype=np.float32)

    persistence_pairs = simplex_tree.persistence()
    dim1_lifetimes = []
    for dim, (birth, death) in persistence_pairs:
        if dim == 1:
            d = 2.0 if np.isinf(death) else death
            dim1_lifetimes.append(d - birth)
    global_max_persistence = max(dim1_lifetimes) if dim1_lifetimes else 0.0

    for i in range(n_nodes):
        features[i, 0] = spins_flat[i] if i < len(spins_flat) else 0.0

        neighbors = list(graph.neighbors(i))
        if neighbors:
            weights = [
                graph[i][nb].get("weight", 0.0) for nb in neighbors
            ]
            features[i, 1] = float(np.mean(weights))
        else:
            features[i, 1] = 0.0

        sub_nodes = [i] + neighbors
        subgraph = graph.subgraph(sub_nodes)
        b0_local, b1_local = fast_betti(subgraph)
        features[i, 2] = float(b0_local)
        features[i, 3] = float(b1_local)

        if neighbors and global_max_persistence > 0:
            degree_ratio = len(neighbors) / max(1, n_nodes - 1)
            features[i, 4] = float(global_max_persistence * degree_ratio)
        else:
            features[i, 4] = 0.0

        features[i, 5] = float(fiedler)

    return features


def build_pyg_data(
    graph: nx.Graph,
    node_features: np.ndarray,
    label: int | None = None,
) -> Data:
    """Convert a NetworkX graph and feature matrix to a PyG Data object.

    Parameters
    ----------
    graph : correlation graph.
    node_features : (N², 6) float32 array.
    label : optional phase label (0=ordered, 1=critical, 2=disordered).

    Returns
    -------
    PyG Data object ready for the TopoGNN.
    """
    edges = list(graph.edges(data=True))
    if edges:
        src = [e[0] for e in edges] + [e[1] for e in edges]
        dst = [e[1] for e in edges] + [e[0] for e in edges]
        edge_index = torch.tensor([src, dst], dtype=torch.long)
        weights = [e[2].get("weight", 1.0) for e in edges]
        edge_attr = torch.tensor(weights + weights, dtype=torch.float32).unsqueeze(1)
    else:
        edge_index = torch.zeros((2, 0), dtype=torch.long)
        edge_attr = torch.zeros((0, 1), dtype=torch.float32)

    x = torch.tensor(node_features, dtype=torch.float32)
    data = Data(x=x, edge_index=edge_index, edge_attr=edge_attr)

    if label is not None:
        data.y = torch.tensor([label], dtype=torch.long)

    return data
