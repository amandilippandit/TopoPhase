"""Graph Laplacian and Fiedler value (algebraic connectivity) computations."""

import networkx as nx
import numpy as np
import scipy.sparse
import scipy.sparse.linalg


def graph_laplacian(graph: nx.Graph) -> np.ndarray:
    """Compute the weighted graph Laplacian L = D - A.

    Returns L as a float64 array.
    """
    A = nx.to_numpy_array(graph, weight="weight", dtype=np.float64)
    D = np.diag(A.sum(axis=1))
    return D - A


def fiedler_value(graph: nx.Graph) -> float:
    """Compute the Fiedler value (second-smallest eigenvalue of the Laplacian).

    Returns 0.0 for disconnected, empty, or single-node graphs.
    """
    n = graph.number_of_nodes()
    if n <= 1:
        return 0.0
    if not nx.is_connected(graph):
        return 0.0

    L = graph_laplacian(graph)

    if n <= 100:
        eigenvalues = np.linalg.eigvalsh(L)
        eigenvalues.sort()
        val = float(eigenvalues[1])
    else:
        L_sparse = scipy.sparse.csr_matrix(L)
        eigenvalues = scipy.sparse.linalg.eigsh(
            L_sparse, k=2, which="SM", return_eigenvectors=False
        )
        eigenvalues.sort()
        val = float(eigenvalues[-1])

    return max(0.0, val)


def spectral_gap_history(fiedler_values: list[float]) -> dict:
    """Summarize a time series of Fiedler values with transition detection."""
    if not fiedler_values:
        return {
            "values": [],
            "min": 0.0,
            "max": 0.0,
            "current": 0.0,
            "transition_detected": False,
        }
    current = fiedler_values[-1]
    previous = fiedler_values[-2] if len(fiedler_values) >= 2 else current
    return {
        "values": fiedler_values,
        "min": min(fiedler_values),
        "max": max(fiedler_values),
        "current": current,
        "transition_detected": current < 0.01 and previous > 0.05,
    }
