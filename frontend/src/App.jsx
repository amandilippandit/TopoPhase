import React, { useEffect, useRef, useState } from 'react'
import { WebSocketClient } from './api/websocket'
import useSimStore from './store/useSimStore'
import LatticeView from './components/LatticeView'
import PersistenceDiagram from './components/PersistenceDiagram'
import BettiTimeline from './components/BettiTimeline'
import SpectralGapChart from './components/SpectralGapChart'
import PhaseAlertPanel from './components/PhaseAlertPanel'
import EarlyWarningBadge from './components/EarlyWarningBadge'

const styles = {
  app: {
    minHeight: '100vh',
    background: '#0f1117',
    color: '#e0e0e0',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    borderBottom: '1px solid #2a2d35',
    background: '#161820',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #378ADD, #D85A30)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '14px',
  },
  dot: (connected) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: connected ? '#4ade80' : '#ef4444',
    boxShadow: connected ? '0 0 6px #4ade80' : '0 0 6px #ef4444',
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr 300px',
    gap: '16px',
    padding: '16px 24px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  panel: {
    background: '#1a1d27',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #2a2d35',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '4px',
    marginTop: '10px',
  },
  slider: {
    width: '100%',
    accentColor: '#378ADD',
  },
  btn: (variant) => ({
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    marginRight: '8px',
    marginTop: '12px',
    background: variant === 'start' ? '#378ADD' : variant === 'stop' ? '#ef4444' : '#4b5563',
    color: '#fff',
  }),
  phaseBadge: (phase) => ({
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    background:
      phase === 'ordered' ? '#065f46' :
      phase === 'critical' ? '#92400e' :
      phase === 'disordered' ? '#991b1b' : '#374151',
    color: '#fff',
  }),
}

export default function App() {
  const wsRef = useRef(null)
  const {
    connected, running, params, currentSnapshot, snapshots,
    setConnected, setRunning, pushSnapshot, setParams, resetRun,
  } = useSimStore()
  const [localParams, setLocalParams] = useState(params)

  useEffect(() => {
    const ws = new WebSocketClient(
      `ws://${window.location.hostname}:8000/ws/stream`,
      (data) => {
        if (data.type === 'connected') return
        if (data.type === 'heartbeat') return
        if (data.step !== undefined) {
          pushSnapshot(data)
          setRunning(true)
        }
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    <div style={styles.app}>
      <div style={styles.topBar}>
        <div style={styles.title}>TopoPhase</div>
        <div style={styles.statusRow}>
          <div style={styles.dot(connected)} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
          {snap && <span>T = {snap.temperature.toFixed(3)} J/k_B</span>}
          {phase && <span style={styles.phaseBadge(phase)}>{phase}</span>}
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left panel */}
        <div>
          <div style={styles.panel}>
            <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>Parameters</h3>

            <label style={styles.label}>Lattice size N = {localParams.N}</label>
            <input type="range" min="4" max="24" value={localParams.N}
              style={styles.slider}
              onChange={(e) => setLocalParams({ ...localParams, N: +e.target.value })} />

            <label style={styles.label}>T start = {localParams.T_start.toFixed(1)}</label>
            <input type="range" min="0.5" max="4.0" step="0.1" value={localParams.T_start}
              style={styles.slider}
              onChange={(e) => setLocalParams({ ...localParams, T_start: +e.target.value })} />

            <label style={styles.label}>T end = {localParams.T_end.toFixed(1)}</label>
            <input type="range" min="1.0" max="5.0" step="0.1" value={localParams.T_end}
              style={styles.slider}
              onChange={(e) => setLocalParams({ ...localParams, T_end: +e.target.value })} />

            <label style={styles.label}>Sweeps/step = {localParams.sweeps_per_step}</label>
            <input type="range" min="1" max="50" value={localParams.sweeps_per_step}
              style={styles.slider}
              onChange={(e) => setLocalParams({ ...localParams, sweeps_per_step: +e.target.value })} />

            <label style={styles.label}>Stream interval = {localParams.stream_interval_ms}ms</label>
            <input type="range" min="100" max="2000" step="50" value={localParams.stream_interval_ms}
              style={styles.slider}
              onChange={(e) => setLocalParams({ ...localParams, stream_interval_ms: +e.target.value })} />

            <div>
              <button style={styles.btn('start')} onClick={handleStart} disabled={running}>
                Start
              </button>
              <button style={styles.btn('stop')} onClick={handleStop} disabled={!running}>
                Stop
              </button>
            </div>
          </div>

          <div style={{ ...styles.panel, marginTop: '12px' }}>
            <EarlyWarningBadge />
          </div>
        </div>

        {/* Center panel */}
        <div>
          <div style={styles.panel}>
            <LatticeView snapshot={snap} />
          </div>
          <div style={{ ...styles.panel, marginTop: '12px' }}>
            <PhaseAlertPanel snapshot={snap} />
          </div>
          <div style={{ ...styles.panel, marginTop: '12px' }}>
            <BettiTimeline snapshots={snapshots} />
          </div>
        </div>

        {/* Right panel */}
        <div>
          <div style={styles.panel}>
            <PersistenceDiagram snapshot={snap} />
          </div>
          <div style={{ ...styles.panel, marginTop: '12px' }}>
            <SpectralGapChart snapshots={snapshots} />
          </div>
        </div>
      </div>
    </div>
  )
}
