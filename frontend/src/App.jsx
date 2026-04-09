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
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
  }
  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--fg);
    line-height: 1;
  }
  .card-desc {
    font-size: 13px;
    color: var(--fg-muted);
    margin-top: 4px;
    line-height: 1.4;
  }
  .separator {
    height: 1px;
    background: var(--border);
    margin: 16px 0;
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .text-muted { color: var(--fg-muted); }
  .text-dim { color: var(--fg-dim); }
  .text-faint { color: var(--fg-faint); }
  .label {
    font-size: 13px;
    font-weight: 500;
    color: var(--fg);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .label-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--fg-muted);
    font-weight: 400;
    background: var(--accent);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--border);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    padding: 0 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    border: none;
    outline: none;
  }
  .btn:focus-visible { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--ring); }
  .btn:disabled { pointer-events: none; opacity: 0.5; }
  .btn-primary { background: var(--fg); color: var(--bg); }
  .btn-primary:hover { opacity: 0.9; }
  .btn-outline { background: transparent; color: var(--fg); border: 1px solid var(--border); }
  .btn-outline:hover { background: var(--accent); }
  .btn-destructive { background: #dc2626; color: #fff; }
  .btn-destructive:hover { background: #b91c1c; }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid transparent;
    line-height: 1.5;
  }
  .badge-default { background: var(--accent); color: var(--fg); border-color: var(--border); }
  .badge-success { background: #052e16; color: #4ade80; border-color: #14532d; }
  .badge-warning { background: #422006; color: #fbbf24; border-color: #713f12; }
  .badge-destructive { background: #450a0a; color: #f87171; border-color: #7f1d1d; }
  .metric-grid {
    display: grid;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .metric-cell {
    background: var(--bg);
    padding: 10px 12px;
  }
  .metric-label { font-size: 11px; color: var(--fg-faint); margin-bottom: 2px; }
  .metric-value { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500; color: var(--fg); }
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{css}</style>

      {/* ─── Header ─── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.3px' }}>TopoPhase</span>
          <span style={{ fontSize: '13px', color: 'var(--fg-faint)' }}>/</span>
          <span style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {snap && (
            <span className="mono" style={{ fontSize: '12px', color: 'var(--fg-dim)' }}>
              Step {snap.step} &middot; T={snap.temperature.toFixed(3)}
            </span>
          )}
          {phase && (
            <span className={`badge ${phase === 'ordered' ? 'badge-success' : phase === 'critical' ? 'badge-warning' : 'badge-destructive'}`}>
              {phase}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: connected ? '#22c55e' : '#ef4444',
            }} />
            <span style={{ fontSize: '12px', color: 'var(--fg-dim)' }}>
              {connected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* ─── Grid ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 280px',
        gap: '16px',
        padding: '20px 24px',
        maxWidth: '1560px',
        margin: '0 auto',
      }}>

        {/* ── Left ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Parameters card */}
          <div className="card">
            <div className="card-title">Parameters</div>
            <div className="card-desc">Configure the Ising lattice and Monte Carlo settings.</div>
            <div className="separator" />

            {[
              { key: 'N', label: 'Lattice size', val: localParams.N, min: 4, max: 24, step: 1 },
              { key: 'T_start', label: 'T start', val: localParams.T_start, min: 0.5, max: 4, step: 0.1, fmt: v => v.toFixed(1) },
              { key: 'T_end', label: 'T end', val: localParams.T_end, min: 1, max: 5, step: 0.1, fmt: v => v.toFixed(1) },
              { key: 'sweeps_per_step', label: 'Sweeps / step', val: localParams.sweeps_per_step, min: 1, max: 50, step: 1 },
              { key: 'stream_interval_ms', label: 'Interval (ms)', val: localParams.stream_interval_ms, min: 100, max: 2000, step: 50 },
            ].map(({ key, label, val, min, max, step, fmt }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div className="label">
                  <span>{label}</span>
                  <span className="label-value">{fmt ? fmt(val) : val}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={val}
                  onChange={e => setLocalParams({ ...localParams, [key]: +e.target.value })} />
              </div>
            ))}

            <div className="separator" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStart} disabled={running}>
                Start Simulation
              </button>
              <button className="btn btn-outline" onClick={handleStop} disabled={!running}>
                Stop
              </button>
            </div>
          </div>

          {/* Early Warning card */}
          <div className="card">
            <div className="card-title">Early Warning</div>
            <div className="card-desc">Topological alarm vs classical detector.</div>
            <div className="separator" />
            <EarlyWarningBadge />
          </div>

          {/* Live Metrics card */}
          <div className="card">
            <div className="card-title">Live Metrics</div>
            <div className="separator" />
            {snap ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { l: 'Magnetization', v: snap.magnetization.toFixed(4) },
                  { l: 'Fiedler value', v: snap.fiedler.toFixed(4) },
                  { l: 'Wasserstein dist.', v: snap.wasserstein.toFixed(4) },
                  { l: 'Transition prob.', v: `${(snap.transition_prob * 100).toFixed(1)}%` },
                  { l: 'Beta-0', v: snap.beta0 },
                  { l: 'Beta-1', v: snap.beta1 },
                ].map(({ l, v }) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>{l}</span>
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--fg)' }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--fg-faint)', textAlign: 'center', padding: '12px 0' }}>
                Start a simulation to see metrics.
              </p>
            )}
          </div>
        </div>

        {/* ── Center ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ alignSelf: 'stretch', marginBottom: 12 }}>
                <div className="card-title">Spin Lattice</div>
                <div className="card-desc">Real-time N x N spin configuration.</div>
              </div>
              <LatticeView snapshot={snap} />
            </div>
            <div className="card">
              <div className="card-title">Phase Classification</div>
              <div className="card-desc">GNN prediction with topological features.</div>
              <div className="separator" />
              <PhaseAlertPanel snapshot={snap} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Betti Numbers</div>
            <div className="card-desc">Connected components (beta-0) and loops (beta-1) over time.</div>
            <div className="separator" />
            <BettiTimeline snapshots={snapshots} />
          </div>

          <div className="card">
            <div className="card-title">Spectral Gap & Topological Distance</div>
            <div className="card-desc">Fiedler value (algebraic connectivity) and Wasserstein distance.</div>
            <div className="separator" />
            <SpectralGapChart snapshots={snapshots} />
          </div>
        </div>

        {/* ── Right ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-title">Persistence Diagram</div>
            <div className="card-desc">Birth-death pairs from Rips filtration.</div>
            <div className="separator" />
            <PersistenceDiagram snapshot={snap} />
          </div>

          {snap && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 0' }}>
                <div className="card-title">Snapshot</div>
              </div>
              <div style={{ padding: '12px 20px 0' }} />
              <div className="metric-grid" style={{ gridTemplateColumns: '1fr 1fr', margin: '12px', borderRadius: '6px' }}>
                {[
                  { l: 'Temperature', v: snap.temperature.toFixed(3) },
                  { l: 'Step', v: snap.step },
                  { l: 'Phase', v: snap.phase },
                  { l: 'Magnetization', v: snap.magnetization.toFixed(3) },
                ].map(({ l, v }) => (
                  <div key={l} className="metric-cell">
                    <div className="metric-label">{l}</div>
                    <div className="metric-value">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {snap && (
            <div className="card">
              <div className="card-title">Phase Probabilities</div>
              <div className="separator" />
              {['Ordered', 'Critical', 'Disordered'].map((name, i) => {
                const pct = snap.phase_probs[i] * 100
                const colors = ['#22c55e', '#eab308', '#ef4444']
                return (
                  <div key={name} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>{name}</span>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--fg)' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--accent)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: colors[i], borderRadius: 9999,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
