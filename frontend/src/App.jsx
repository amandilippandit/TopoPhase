import React, { useEffect, useRef, useState } from 'react'
import { WebSocketClient } from './api/websocket'
import useSimStore from './store/useSimStore'
import LatticeView from './components/LatticeView'
import PersistenceDiagram from './components/PersistenceDiagram'
import BettiTimeline from './components/BettiTimeline'
import SpectralGapChart from './components/SpectralGapChart'
import PhaseAlertPanel from './components/PhaseAlertPanel'
import EarlyWarningBadge from './components/EarlyWarningBadge'

const css = `
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .card {
    background: #0b1222;
    border: 1px solid #141d2f;
    border-radius: 10px;
    padding: 16px;
  }
  .section-title {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #4a5568;
    margin-bottom: 12px;
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .param-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }
  .param-row:not(:first-child) { margin-top: 12px; }
  .param-label { font-size: 11px; color: #5a6378; font-weight: 400; }
  .param-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #3b82f6; font-weight: 500; }
  .btn {
    padding: 7px 18px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 12px;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s ease;
  }
  .btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn-blue { background: #1d4ed8; color: #fff; }
  .btn-blue:hover:not(:disabled) { background: #2563eb; }
  .btn-dark { background: #111828; color: #5a6378; border: 1px solid #1a2438; }
  .btn-dark:hover:not(:disabled) { background: #141d2f; color: #8b92a5; }
  .stat-box {
    background: #0d1526;
    border: 1px solid #141d2f;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .stat-label { font-size: 9px; color: #3d4759; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; }
  .stat-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #c8cdd8; font-weight: 500; }
  .phase-pill {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }
`

export default function App() {
  const wsRef = useRef(null)
  const {
    connected, running, currentSnapshot, snapshots,
    setConnected, setRunning, pushSnapshot, resetRun,
  } = useSimStore()
  const [localParams, setLocalParams] = useState({
    N: 12, T_start: 0.5, T_end: 5.0, n_temperature_steps: 100,
    sweeps_per_step: 10, stream_interval_ms: 200, graph_threshold: 0.01,
  })

  useEffect(() => {
    const ws = new WebSocketClient(
      `ws://${window.location.hostname}:8000/ws/stream`,
      (data) => {
        if (data.type === 'connected' || data.type === 'heartbeat') return
        if (data.step !== undefined) { pushSnapshot(data); setRunning(true) }
      },
      () => setConnected(true),
      () => setConnected(false),
    )
    ws.connect()
    wsRef.current = ws
    return () => ws.disconnect()
  }, [])

  const handleStart = async () => {
    resetRun()
    await fetch('/api/params', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localParams),
    })
    await fetch('/api/start', { method: 'POST' })
    setRunning(true)
  }

  const handleStop = async () => {
    await fetch('/api/stop', { method: 'POST' })
    setRunning(false)
  }

  const snap = currentSnapshot
  const phase = snap ? snap.phase : null

  return (
    <div style={{ minHeight: '100vh', background: '#060a14' }}>
      <style>{css}</style>

      {/* Top nav */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 24px', borderBottom: '1px solid #0f1829',
        background: '#080d19',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#1d4ed8" strokeWidth="1.5" fill="none"/>
            <circle cx="10" cy="10" r="3" fill="#3b82f6"/>
            <path d="M10 2 L10 5 M10 15 L10 18 M2 10 L5 10 M15 10 L18 10" stroke="#1d4ed8" strokeWidth="1"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#c8cdd8', letterSpacing: '0.3px' }}>
            TopoPhase
          </span>
          <span style={{ fontSize: '10px', color: '#2d3748', marginLeft: '2px' }}>Explore</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {snap && (
            <>
              <span className="mono" style={{ fontSize: '11px', color: '#3d4759' }}>
                Step <span style={{ color: '#5a6378' }}>{snap.step}</span>
              </span>
              <span className="mono" style={{ fontSize: '11px', color: '#3d4759' }}>
                T = <span style={{ color: '#5a6378' }}>{snap.temperature.toFixed(3)}</span>
              </span>
            </>
          )}
          {phase && (
            <span className="phase-pill" style={{
              background: phase === 'ordered' ? '#0c2d1f' : phase === 'critical' ? '#2d1f0c' : '#2d0c0c',
              color: phase === 'ordered' ? '#34d399' : phase === 'critical' ? '#fbbf24' : '#f87171',
              border: `1px solid ${phase === 'ordered' ? '#134e35' : phase === 'critical' ? '#4e3513' : '#4e1313'}`,
            }}>
              {phase}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: connected ? '#22c55e' : '#ef4444',
              animation: connected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: '10px', color: '#3d4759' }}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 260px',
        gap: '12px',
        padding: '16px 20px',
        maxWidth: '1520px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 45px)',
      }}>
        {/* ── Left sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Controls */}
          <div className="card">
            <div className="section-title">Simulation parameters</div>
            <div style={{ fontSize: '10px', color: '#3d4759', marginBottom: '14px', lineHeight: 1.5 }}>
              Configure the Ising lattice and Monte Carlo sweep settings.
            </div>

            <div className="param-row">
              <span className="param-label">Lattice N</span>
              <span className="param-val">{localParams.N}</span>
            </div>
            <input type="range" min="4" max="24" value={localParams.N}
              onChange={e => setLocalParams({ ...localParams, N: +e.target.value })} />

            <div className="param-row">
              <span className="param-label">T start</span>
              <span className="param-val">{localParams.T_start.toFixed(1)}</span>
            </div>
            <input type="range" min="0.5" max="4.0" step="0.1" value={localParams.T_start}
              onChange={e => setLocalParams({ ...localParams, T_start: +e.target.value })} />

            <div className="param-row">
              <span className="param-label">T end</span>
              <span className="param-val">{localParams.T_end.toFixed(1)}</span>
            </div>
            <input type="range" min="1.0" max="5.0" step="0.1" value={localParams.T_end}
              onChange={e => setLocalParams({ ...localParams, T_end: +e.target.value })} />

            <div className="param-row">
              <span className="param-label">Sweeps / step</span>
              <span className="param-val">{localParams.sweeps_per_step}</span>
            </div>
            <input type="range" min="1" max="50" value={localParams.sweeps_per_step}
              onChange={e => setLocalParams({ ...localParams, sweeps_per_step: +e.target.value })} />

            <div className="param-row">
              <span className="param-label">Stream interval</span>
              <span className="param-val">{localParams.stream_interval_ms}ms</span>
            </div>
            <input type="range" min="100" max="2000" step="50" value={localParams.stream_interval_ms}
              onChange={e => setLocalParams({ ...localParams, stream_interval_ms: +e.target.value })} />

            <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
              <button className="btn btn-blue" onClick={handleStart} disabled={running}>Start</button>
              <button className="btn btn-dark" onClick={handleStop} disabled={!running}>Stop</button>
            </div>
          </div>

          {/* Early warning */}
          <div className="card">
            <div className="section-title">Early warning</div>
            <EarlyWarningBadge />
          </div>

          {/* Performance constraints / live stats */}
          <div className="card">
            <div className="section-title">Live metrics</div>
            {snap ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Magnetization', val: snap.magnetization.toFixed(4) },
                  { label: 'Fiedler value', val: snap.fiedler.toFixed(4) },
                  { label: 'Wasserstein', val: snap.wasserstein.toFixed(4) },
                  { label: 'Transition prob', val: `${(snap.transition_prob * 100).toFixed(1)}%` },
                  { label: 'Beta-0', val: snap.beta0 },
                  { label: 'Beta-1', val: snap.beta1 },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#3d4759' }}>{label}</span>
                    <span className="mono" style={{ fontSize: '11px', color: '#8b92a5' }}>{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#2d3748', textAlign: 'center', padding: '8px 0' }}>
                Start simulation to see metrics
              </div>
            )}
          </div>
        </div>

        {/* ── Center column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Top row: lattice + phase panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LatticeView snapshot={snap} />
            </div>
            <div className="card">
              <PhaseAlertPanel snapshot={snap} />
            </div>
          </div>
          {/* Betti chart */}
          <div className="card">
            <div className="section-title">Betti numbers</div>
            <BettiTimeline snapshots={snapshots} />
          </div>
          {/* Spectral chart */}
          <div className="card">
            <div className="section-title">Spectral gap & topological distance</div>
            <SpectralGapChart snapshots={snapshots} />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card">
            <div className="section-title">Persistence diagram</div>
            <PersistenceDiagram snapshot={snap} />
          </div>

          {/* Snapshot info cards */}
          {snap && (
            <div className="card">
              <div className="section-title">Current snapshot</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { label: 'Temperature', val: snap.temperature.toFixed(3) },
                  { label: 'Step', val: snap.step },
                  { label: 'Phase', val: snap.phase },
                  { label: 'M', val: snap.magnetization.toFixed(3) },
                ].map(({ label, val }) => (
                  <div key={label} className="stat-box">
                    <div className="stat-label">{label}</div>
                    <div className="stat-val">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {snap && (
            <div className="card">
              <div className="section-title">Phase probabilities</div>
              {['Ordered', 'Critical', 'Disordered'].map((name, i) => (
                <div key={name} style={{ marginBottom: i < 2 ? '10px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#5a6378' }}>{name}</span>
                    <span className="mono" style={{ fontSize: '11px', color: '#8b92a5' }}>
                      {(snap.phase_probs[i] * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: '3px', background: '#111828', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${snap.phase_probs[i] * 100}%`,
                      height: '100%',
                      background: i === 0 ? '#22c55e' : i === 1 ? '#eab308' : '#ef4444',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
