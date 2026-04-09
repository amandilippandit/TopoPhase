"""FastAPI application with WebSocket streaming for the TopoPhase dashboard."""

from __future__ import annotations

import asyncio
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import SimParams
from api.simulator import AsyncSimulator

app = FastAPI(title="TopoPhase API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_params = SimParams()
active_simulator: AsyncSimulator | None = None
simulator_task: asyncio.Task | None = None


@app.get("/health")
async def health():
    model_loaded = active_simulator.model_loaded if active_simulator else False
    return {"status": "ok", "model_loaded": model_loaded}


@app.get("/params")
async def get_params():
    return current_params.model_dump()


@app.post("/params")
async def set_params(params: SimParams):
    global current_params
    current_params = params
    return current_params.model_dump()


@app.post("/start")
async def start_simulation():
    global active_simulator, simulator_task
    if active_simulator and active_simulator.running:
        return {"started": False, "message": "Simulation already running"}
    active_simulator = AsyncSimulator(current_params)
    simulator_task = asyncio.create_task(active_simulator.run())
    return {"started": True}


@app.post("/stop")
async def stop_simulation():
    global active_simulator, simulator_task
    if active_simulator:
        await active_simulator.stop()
    if simulator_task and not simulator_task.done():
        simulator_task.cancel()
        try:
            await simulator_task
        except asyncio.CancelledError:
            pass
    active_simulator = None
    simulator_task = None
    return {"stopped": True}


@app.get("/status")
async def get_status():
    if active_simulator:
        return {
            "running": active_simulator.running,
            "step": active_simulator.step_count,
            "temperature": float(active_simulator.lattice.T),
        }
    return {"running": False, "step": 0, "temperature": 0.0}


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json(
        {"type": "connected", "params": current_params.model_dump()}
    )
    try:
        while True:
            if active_simulator and active_simulator.running:
                try:
                    snapshot = await asyncio.wait_for(
                        active_simulator.snapshot_queue.get(), timeout=1.0
                    )
                    await websocket.send_text(snapshot.model_dump_json())
                except asyncio.TimeoutError:
                    await websocket.send_json(
                        {"type": "heartbeat", "ts": time.time()}
                    )
            else:
                await websocket.send_json(
                    {"type": "heartbeat", "ts": time.time()}
                )
                await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
