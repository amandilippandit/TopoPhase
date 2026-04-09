"""Async simulator that runs the Ising MC + topology + GNN pipeline and streams snapshots."""

from __future__ import annotations

import asyncio
import os
from collections import deque

import numpy as np
import torch

from api.schemas import PersistencePoint, SimParams, SimSnapshot
from gnn.features import build_node_features, build_pyg_data
from gnn.model import TopoGNN
from sim.correlations import compute_correlation_matrix
from sim.lattice import IsingLattice
from topo.graph_builder import build_graph
from topo.homology import compute_persistence, fast_betti, persistence_diagram_points
from topo.spectral import fiedler_value
from topo.wasserstein import detect_topological_alarm, wasserstein_distance


class AsyncSimulator:
    """Runs the full simulation pipeline asynchronously, pushing snapshots to a queue."""

    def __init__(
        self,
        params: SimParams,
        model_path: str = "checkpoints/topognn.pt",
    ):
        self.params = params
        self.lattice = IsingLattice(N=params.N, J=params.J, T=params.T_start)

        self.model = TopoGNN(in_channels=6, hidden=64, n_classes=3)
        if os.path.isfile(model_path):
            self.model.load_state_dict(
                torch.load(model_path, map_location="cpu", weights_only=True)
            )
            self.model_loaded = True
        else:
            self.model_loaded = False
        self.model.eval()

        self.step_count = 0
        self.spin_history: deque[np.ndarray] = deque(maxlen=params.correlation_window)
        self.diagram_history: list[list[dict]] = []
        self.wasserstein_history: list[float] = []
        self.magnetization_history: list[float] = []
        self.topo_alarm_step: int | None = None
        self.classical_alarm_step: int | None = None
        self.temperatures = np.linspace(
            params.T_start, params.T_end, params.n_temperature_steps
        )
        self.running = False
        self.snapshot_queue: asyncio.Queue[SimSnapshot] = asyncio.Queue(maxsize=10)

    async def run(self) -> None:
        self.running = True
        loop = asyncio.get_event_loop()

        await loop.run_in_executor(None, self.lattice.thermalize, 1000)

        for step_idx in range(len(self.temperatures)):
            if not self.running:
                break

            self.lattice.T = float(self.temperatures[step_idx])

            spins = await loop.run_in_executor(
                None, self.lattice.step, self.params.sweeps_per_step
            )
            self.spin_history.append(spins)

            if len(self.spin_history) >= 10:
                snapshot = await loop.run_in_executor(
                    None, self._compute_snapshot, step_idx, spins
                )
                try:
                    self.snapshot_queue.put_nowait(snapshot)
                except asyncio.QueueFull:
                    try:
                        self.snapshot_queue.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                    self.snapshot_queue.put_nowait(snapshot)

            await asyncio.sleep(self.params.stream_interval_ms / 1000)
            self.step_count = step_idx + 1

        self.running = False

    def _compute_snapshot(self, step_idx: int, current_spins: np.ndarray) -> SimSnapshot:
        C = compute_correlation_matrix(list(self.spin_history))
        graph = build_graph(C, threshold=self.params.graph_threshold)
        b0, b1 = fast_betti(graph)
        fiedler = fiedler_value(graph)

        simplex_tree = compute_persistence(graph)
        diag = persistence_diagram_points(simplex_tree)
        self.diagram_history.append(diag)

        wass = 0.0
        if len(self.diagram_history) > 1:
            wass = wasserstein_distance(self.diagram_history[-2], diag)
        self.wasserstein_history.append(wass)

        if self.topo_alarm_step is None and len(self.wasserstein_history) >= 5:
            alarms = detect_topological_alarm(self.wasserstein_history, threshold_sigma=3.0)
            if alarms:
                self.topo_alarm_step = alarms[-1]

        topo_alarm = self.topo_alarm_step is not None and self.topo_alarm_step == step_idx

        features = build_node_features(graph, current_spins, simplex_tree, fiedler)
        pyg_data = build_pyg_data(graph, features)

        with torch.no_grad():
            phase_logits, trans_prob = self.model(pyg_data)
        phase_probs = torch.softmax(phase_logits, dim=-1)[0].tolist()
        phase_idx = int(np.argmax(phase_probs))
        phase_name = ["ordered", "critical", "disordered"][phase_idx]
        transition_prob = float(trans_prob[0, 0])

        mag = self.lattice.magnetization()
        self.magnetization_history.append(mag)

        classical_alarm = False
        if self.classical_alarm_step is None and len(self.magnetization_history) >= 5:
            recent = self.magnetization_history[-5:]
            if recent[0] - recent[-1] > 0.1:
                self.classical_alarm_step = step_idx
                classical_alarm = True

        lead_time: int | None = None
        if self.topo_alarm_step is not None and self.classical_alarm_step is not None:
            lead_time = self.classical_alarm_step - self.topo_alarm_step

        lattice_grid = current_spins.tolist()

        persistence_points = [
            PersistencePoint(birth=p["birth"], death=p["death"], dim=p["dim"])
            for p in diag
        ]

        return SimSnapshot(
            step=step_idx,
            temperature=float(self.temperatures[step_idx]),
            magnetization=mag,
            beta0=b0,
            beta1=b1,
            fiedler=fiedler,
            wasserstein=wass,
            phase=phase_name,
            phase_probs=phase_probs,
            transition_prob=transition_prob,
            lattice=lattice_grid,
            persistence=persistence_points,
            topo_alarm=topo_alarm or (self.topo_alarm_step is not None),
            classical_alarm=classical_alarm or (self.classical_alarm_step is not None),
            topo_alarm_step=self.topo_alarm_step,
            classical_alarm_step=self.classical_alarm_step,
            lead_time_steps=lead_time,
        )

    async def stop(self) -> None:
        self.running = False
