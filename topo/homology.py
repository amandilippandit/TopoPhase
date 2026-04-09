"""Persistent homology computations using GUDHI and fast Betti via Euler characteristic."""

import gudhi
import networkx as nx
import numpy as np

from topo.graph_builder import graph_to_point_cloud


def compute_persistence(
    graph: nx.Graph, max_edge_length: float = 2.0
) -> gudhi.SimplexTree:
    """Build a Rips complex from the graph's spectral embedding and compute persistence.

    Returns the SimplexTree with persistence already computed.
    """
    points = graph_to_point_cloud(graph)
    rips = gudhi.RipsComplex(points=points, max_edge_length=max_edge_length)
    st = rips.create_simplex_tree(max_dimension=2)
    st.compute_persistence()
    return st


def betti_numbers(
    simplex_tree: gudhi.SimplexTree, threshold: float = 0.05
) -> tuple[int, int]:
    """Compute β₀ and β₁ from a persistence-computed SimplexTree.

    Only counts features with persistence lifetime > threshold.
    """
    intervals_0 = simplex_tree.persistence_intervals_in_dimension(0)
    intervals_1 = simplex_tree.persistence_intervals_in_dimension(1)

    b0 = 0
    for birth, death in intervals_0:
        lifetime = (2.0 if np.isinf(death) else death) - birth
        if lifetime > threshold:
            b0 += 1

    b1 = 0
    for birth, death in intervals_1:
        lifetime = (2.0 if np.isinf(death) else death) - birth
        if lifetime > threshold:
            b1 += 1

    return b0, b1


def fast_betti(graph: nx.Graph) -> tuple[int, int]:
    """Compute Betti numbers using the Euler characteristic relation.

    β₀ = number of connected components
    β₁ = |E| - |V| + β₀
    """
    b0 = nx.number_connected_components(graph)
    b1 = graph.number_of_edges() - graph.number_of_nodes() + b0
    return b0, max(0, b1)


def persistence_diagram_points(
    simplex_tree: gudhi.SimplexTree,
) -> list[dict]:
    """Extract persistence diagram as a list of {birth, death, dim} dicts.

    Caps infinite deaths at 2.0 and filters noise (lifetime < 1e-6).
    """
    pairs = simplex_tree.persistence()
    points = []
    for dim, (birth, death) in pairs:
        d = 2.0 if np.isinf(death) else death
        if d - birth < 1e-6:
            continue
        points.append({"birth": float(birth), "death": float(d), "dim": int(dim)})
    return points
