"""Pydantic v2 schemas for the TopoPhase API."""

from typing import Literal

from pydantic import BaseModel, Field


class SimParams(BaseModel):
    N: int = Field(default=12, ge=4, le=30)
    J: float = Field(default=1.0, gt=0)
    T_start: float = Field(default=0.5, gt=0)
    T_end: float = Field(default=5.0, gt=0)
    n_temperature_steps: int = Field(default=100, ge=10, le=500)
    sweeps_per_step: int = Field(default=10, ge=1, le=100)
    correlation_window: int = Field(default=50, ge=10, le=200)
    graph_threshold: float = Field(default=0.01, ge=0, le=1)
    stream_interval_ms: int = Field(default=200, ge=50, le=2000)


class PersistencePoint(BaseModel):
    birth: float
    death: float
    dim: int


class SimSnapshot(BaseModel):
    step: int
    temperature: float
    magnetization: float
    beta0: int
    beta1: int
    fiedler: float
    wasserstein: float
    phase: Literal["ordered", "critical", "disordered"]
    phase_probs: list[float]
    transition_prob: float
    lattice: list[list[float]]
    persistence: list[PersistencePoint]
    topo_alarm: bool
    classical_alarm: bool
    topo_alarm_step: int | None
    classical_alarm_step: int | None
    lead_time_steps: int | None
