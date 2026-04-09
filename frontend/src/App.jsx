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
  @keyframes float-orb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.1); }
    66% { transform: translate(-20px, 15px) scale(0.95); }
  }
  @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes glow-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
  .glass-card {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    animation: fade-in 0.4s ease-out;
  }
  .glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(167,139,250,0.15), transparent 50%, rgba(99,102,241,0.08));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(167,139,250,0.6);
    margin-bottom: 14px;
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .btn-primary {
    padding: 10px 28px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.3px;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    overflow: hidden;
  }
  .btn-primary:hover { transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .btn-start {
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    color: #fff;
    box-shadow: 0 4px 15px rgba(124,58,237,0.25);
  }
  .btn-start:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(124,58,237,0.4); }
  .btn-stop {
    background: rgba(239,68,68,0.12);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.2);
    box-shadow: none;
  }
  .btn-stop:hover:not(:disabled) { background: rgba(239,68,68,0.2); }
  .param-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
  }
  .param-label {
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    font-weight: 400;
  }
  .param-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: rgba(167,139,250,0.8);
    font-weight: 500;
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

  const phaseGradient = phase === 'ordered'
    ? 'linear-gradient(135deg, rgba(16,185,129,0.12), transparent)'
    : phase === 'critical'
    ? 'linear-gradient(135deg, rgba(245,158,11,0.12), transparent)'
    : phase === 'disordered'
    ? 'linear-gradient(135deg, rgba(239,68,68,0.1), transparent)'
    : 'none'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08090d',
      position: 'relative',
    }}>
      <style>{css}</style>

      {/* Background orbs */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
          animation: 'float-orb 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-10%', width: '600px', height: '600px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
          animation: 'float-orb 25s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '50%', width: '400px', height: '400px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.03) 0%, transparent 70%)',
          animation: 'float-orb 18s ease-in-out infinite 5s',
        }} />
      </div>

      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px',
        background: 'rgba(8,9,13,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#a78bfa',
            boxShadow: '0 0 10px rgba(167,139,250,0.5)',
          }} />
          <span style={{
            fontSize: '16px', fontWeight: 600, letterSpacing: '0.5px',
            color: '#e2e4e9',
          }}>TopoPhase</span>
          <span style={{
            fontSize: '10px', fontWeight: 500, letterSpacing: '1px',
            color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginLeft: '4px',
          }}>quantum phase detector</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {snap && (
            <span className="mono" style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.35)',
            }}>
              T = {snap.temperature.toFixed(3)}
            </span>
          )}
          {snap && (
            <span className="mono" style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.35)',
            }}>
              Step {snap.step}
            </span>
          )}
          {phase && (
            <span style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
              fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
              background: phase === 'ordered' ? 'rgba(16,185,129,0.12)'
                : phase === 'critical' ? 'rgba(245,158,11,0.12)'
                : 'rgba(239,68,68,0.1)',
              color: phase === 'ordered' ? '#34d399'
                : phase === 'critical' ? '#fbbf24'
                : '#f87171',
              border: `1px solid ${phase === 'ordered' ? 'rgba(16,185,129,0.2)'
                : phase === 'critical' ? 'rgba(245,158,11,0.2)'
                : 'rgba(239,68,68,0.15)'}`,
            }}>
              {phase}
            </span>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: connected ? '#4ade80' : '#ef4444',
              boxShadow: connected ? '0 0 8px rgba(74,222,128,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
            }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 280px',
        gap: '14px',
        padding: '20px 28px',
        maxWidth: '1560px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-card">
            <div className="section-label">Controls</div>

            <div className="param-row" style={{ marginTop: 0 }}>
              <span className="param-label">Lattice N</span>
              <span className="param-value">{localParams.N}</span>
            </div>
            <input type="range" min="4" max="24" value={localParams.N}
              onChange={(e) => setLocalParams({ ...localParams, N: +e.target.value })} />

            <div className="param-row">
              <span className="param-label">T start</span>
              <span className="param-value">{localParams.T_start.toFixed(1)}</span>
            </div>
            <input type="range" min="0.5" max="4.0" step="0.1" value={localParams.T_start}
              onChange={(e) => setLocalParams({ ...localParams, T_start: +e.target.value })} />

            <div className="param-row">
              <span className="param-label">T end</span>
              <span className="param-value">{localParams.T_end.toFixed(1)}</span>
            </div>
            <input type="range" min="1.0" max="5.0" step="0.1" value={localParams.T_end}
              onChange={(e) => setLocalParams({ ...localParams, T_end: +e.target.value })} />

            <div className="param-row">
              <span className="param-label">Sweeps / step</span>
              <span className="param-value">{localParams.sweeps_per_step}</span>
            </div>
            <input type="range" min="1" max="50" value={localParams.sweeps_per_step}
              onChange={(e) => setLocalParams({ ...localParams, sweeps_per_step: +e.target.value })} />

            <div className="param-row">
              <span className="param-label">Interval</span>
              <span className="param-value">{localParams.stream_interval_ms}ms</span>
            </div>
            <input type="range" min="100" max="2000" step="50" value={localParams.stream_interval_ms}
              onChange={(e) => setLocalParams({ ...localParams, stream_interval_ms: +e.target.value })} />

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button className="btn-primary btn-start" onClick={handleStart} disabled={running}>
                Start
              </button>
              <button className="btn-primary btn-stop" onClick={handleStop} disabled={!running}>
                Stop
              </button>
            </div>
          </div>

          <div className="glass-card">
            <div className="section-label">Early Warning</div>
            <EarlyWarningBadge />
          </div>

          {/* Live stats */}
          {snap && (
            <div className="glass-card">
              <div className="section-label">Live Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Magnetization', value: snap.magnetization.toFixed(3) },
                  { label: 'Fiedler', value: snap.fiedler.toFixed(4) },
                  { label: 'Wasserstein', value: snap.wasserstein.toFixed(4) },
                  { label: 'Transition', value: `${(snap.transition_prob * 100).toFixed(0)}%` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '10px 12px',
                    border: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>{label}</div>
                    <div className="mono" style={{ fontSize: '14px', color: '#e2e4e9', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="section-label" style={{ alignSelf: 'flex-start' }}>Spin Lattice</div>
              <LatticeView snapshot={snap} />
            </div>
            <div className="glass-card">
              <div className="section-label">Phase Classification</div>
              <PhaseAlertPanel snapshot={snap} />
            </div>
          </div>

          <div className="glass-card">
            <div className="section-label">Betti Numbers</div>
            <BettiTimeline snapshots={snapshots} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-card">
            <div className="section-label">Persistence Diagram</div>
            <PersistenceDiagram snapshot={snap} />
          </div>
          <div className="glass-card">
            <div className="section-label">Spectral Analysis</div>
            <SpectralGapChart snapshots={snapshots} />
          </div>
        </div>
      </div>
    </div>
  )
}
