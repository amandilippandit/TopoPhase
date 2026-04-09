"""2D Ising model with Metropolis-Hastings Monte Carlo simulation."""

import numpy as np


class IsingLattice:
    """Square lattice Ising model at temperature T with coupling J."""

    def __init__(self, N: int, J: float = 1.0, T: float = 3.0, seed: int = 42):
        self.N = N
        self.J = J
        self._T = T
        self._beta = 1.0 / T
        self.rng = np.random.default_rng(seed)
        self.spins = self.rng.choice(np.array([-1, 1], dtype=np.int8), size=(N, N))

    @property
    def T(self) -> float:
        return self._T

    @T.setter
    def T(self, value: float) -> None:
        self._T = value
        self._beta = 1.0 / value

    @property
    def beta(self) -> float:
        return self._beta

    def _energy_diff(self, i: int, j: int) -> float:
        N = self.N
        s = self.spins
        neighbours = (
            s[(i - 1) % N, j]
            + s[(i + 1) % N, j]
            + s[i, (j - 1) % N]
            + s[i, (j + 1) % N]
        )
        return 2.0 * self.J * float(s[i, j]) * float(neighbours)

    def sweep(self) -> None:
        N = self.N
        n_attempts = N * N
        for _ in range(n_attempts):
            i = self.rng.integers(0, N)
            j = self.rng.integers(0, N)
            dE = self._energy_diff(i, j)
            if dE <= 0.0 or self.rng.random() < np.exp(-dE * self._beta):
                self.spins[i, j] *= -1

    def thermalize(self, n_sweeps: int = 1000) -> None:
        for _ in range(n_sweeps):
            self.sweep()

    def step(self, n_sweeps: int = 1) -> np.ndarray:
        for _ in range(n_sweeps):
            self.sweep()
        return self.spins.astype(np.float32).copy()

    def magnetization(self) -> float:
        return float(np.abs(np.mean(self.spins)))

    def energy_per_site(self) -> float:
        s = self.spins.astype(np.float64)
        E = -self.J * np.sum(s * (np.roll(s, -1, axis=0) + np.roll(s, -1, axis=1)))
        return float(E / (self.N * self.N))
