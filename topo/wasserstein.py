"""Wasserstein/bottleneck distance between persistence diagrams and alarm detection."""

import numpy as np
import gudhi


def wasserstein_distance(
    diag1: list[dict], diag2: list[dict], dim: int = 1
) -> float:
    """Compute the bottleneck distance between two persistence diagrams in a given dimension.

    Parameters
    ----------
    diag1, diag2 : lists of {"birth": float, "death": float, "dim": int}
    dim : homology dimension to compare (default 1 = loops).

    Returns
    -------
    Bottleneck distance as a float.
    """
    pts1 = np.array(
        [[p["birth"], p["death"]] for p in diag1 if p["dim"] == dim], dtype=np.float64
    )
    pts2 = np.array(
        [[p["birth"], p["death"]] for p in diag2 if p["dim"] == dim], dtype=np.float64
    )

    if pts1.size == 0 and pts2.size == 0:
        return 0.0
    if pts1.size == 0:
        pts1 = np.empty((0, 2), dtype=np.float64)
    if pts2.size == 0:
        pts2 = np.empty((0, 2), dtype=np.float64)

    return float(gudhi.bottleneck_distance(pts1, pts2))


def wasserstein_series(diagram_history: list[list[dict]]) -> list[float]:
    """Compute consecutive bottleneck distances from a time series of diagrams.

    Returns a list of the same length as the input, with 0.0 prepended.
    """
    if len(diagram_history) <= 1:
        return [0.0] * len(diagram_history)
    distances = [0.0]
    for i in range(1, len(diagram_history)):
        distances.append(wasserstein_distance(diagram_history[i - 1], diagram_history[i]))
    return distances


def detect_topological_alarm(
    wass_series: list[float], threshold_sigma: float = 3.0
) -> list[int]:
    """Return step indices where the Wasserstein distance exceeds mean + threshold_sigma * std."""
    if len(wass_series) < 2:
        return []
    arr = np.array(wass_series, dtype=np.float64)
    mu = arr.mean()
    sigma = arr.std()
    if sigma < 1e-12:
        return []
    threshold = mu + threshold_sigma * sigma
    return [int(i) for i, v in enumerate(wass_series) if v > threshold]
