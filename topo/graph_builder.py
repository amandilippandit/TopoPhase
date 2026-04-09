"""Build weighted correlation graphs and filtrations for persistent homology."""

import networkx as nx
import numpy as np


def build_graph(C: np.ndarray, threshold: float = 0.0) -> nx.Graph:
    """Build a weighted undirected graph from a correlation matrix.

    Parameters
    ----------
    C : (N², N²) correlation matrix.
    threshold : only include edges with weight > threshold.

    Returns
    -------
    G : networkx Graph with N² nodes and weighted edges.
    """
    n_nodes = C.shape[0]
    G = nx.Graph()
    G.add_nodes_from(range(n_nodes))
    rows, cols = np.where(C > threshold)
    mask = rows < cols
    rows, cols = rows[mask], cols[mask]
    for r, c in zip(rows, cols):
        G.add_edge(int(r), int(c), weight=float(C[r, c]))
    return G


def build_filtration(
    C: np.ndarray, n_steps: int = 30
) -> list[tuple[float, nx.Graph]]:
    """Build a descending-threshold filtration of correlation graphs.

    Returns a list of (epsilon, graph) pairs from max(C) down to 0.
    """
    c_max = float(C.max())
    if c_max <= 0:
        return [(0.0, build_graph(C, threshold=0.0))]
    epsilon_values = np.linspace(c_max, 0.0, n_steps)
    return [(float(eps), build_graph(C, threshold=eps)) for eps in epsilon_values]


def graph_to_point_cloud(graph: nx.Graph) -> np.ndarray:
    """Embed graph nodes into 2D using spectral layout for Rips complex input.

    Returns array of shape (n_nodes, 2) as float64.
    """
    if graph.number_of_nodes() < 3 or graph.number_of_edges() == 0:
        pos = nx.spring_layout(graph, seed=42)
    else:
        try:
            pos = nx.spectral_layout(graph)
        except Exception:
            pos = nx.spring_layout(graph, seed=42)
    n = graph.number_of_nodes()
    points = np.zeros((n, 2), dtype=np.float64)
    for node, coords in pos.items():
        points[node] = coords
    return points
