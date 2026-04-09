"""Spin-spin correlation matrix from Monte Carlo histories."""

from __future__ import annotations

from collections import deque
from typing import Generator

import numpy as np

from sim.lattice import IsingLattice


def compute_correlation_matrix(spin_history: list[np.ndarray]) -> np.ndarray:
    """Compute connected correlation matrix |<σᵢσⱼ> - <σᵢ><σⱼ>| from spin snapshots.

    Parameters
    ----------
    spin_history : list of (N, N) arrays with values ±1.0

    Returns
    -------
    C : (N², N²) float32 correlation matrix with zero diagonal.
    """
    W = len(spin_history)
    N = spin_history[0].shape[0]
    flat = np.array([s.ravel() for s in spin_history], dtype=np.float64)  # (W, N²)

    mean_i = flat.mean(axis=0)  # (N²,)
    mean_ij = (flat.T @ flat) / W  # (N², N²)
    C = np.abs(mean_ij - np.outer(mean_i, mean_i))
    np.fill_diagonal(C, 0.0)
    return C.astype(np.float32)


def rolling_correlation(
    lattice: IsingLattice,
    window: int = 50,
    n_steps_per_update: int = 5,
) -> Generator[np.ndarray, None, None]:
    """Generator that yields updated correlation matrices after each MC step batch.

    Yields correlation matrices once the deque has at least 10 snapshots.
    """
    history: deque[np.ndarray] = deque(maxlen=window)
    while True:
        spins = lattice.step(n_steps_per_update)
        history.append(spins)
        if len(history) >= 10:
            yield compute_correlation_matrix(list(history))
