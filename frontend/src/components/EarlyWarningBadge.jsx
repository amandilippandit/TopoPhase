import React from 'react'
import useSimStore from '../store/useSimStore'

export default function EarlyWarningBadge() {
  const { topoAlarmStep, classicalAlarmStep, leadTime, snapshots } = useSimStore()
  const topoSnap = topoAlarmStep != null ? snapshots.find(s => s.step === topoAlarmStep) : null
  const classicalSnap = classicalAlarmStep != null ? snapshots.find(s => s.step === classicalAlarmStep) : null

  if (topoAlarmStep == null && classicalAlarmStep == null) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--fg-faint)', textAlign: 'center', padding: '4px 0' }}>
        Monitoring for phase transition...
      </p>
    )
  }

  if (topoAlarmStep != null && classicalAlarmStep == null) {
    return (
      <div style={{
        background: '#422006', border: '1px solid #713f12',
        borderRadius: 8, padding: '14px', textAlign: 'center',
      }}>
        <span className="badge badge-warning" style={{ marginBottom: 8, display: 'inline-flex' }}>
          Topological Warning
        </span>
        <div className="mono" style={{ fontSize: '12px', color: '#fbbf24', marginTop: 8 }}>
          Detected at step {topoAlarmStep}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--fg-dim)', marginTop: 4 }}>
          Awaiting classical confirmation...
        </p>
      </div>
    )
  }

  if (topoAlarmStep != null && classicalAlarmStep != null) {
    if (leadTime > 0) {
      return (
        <div style={{
          background: '#052e16', border: '1px solid #14532d',
          borderRadius: 8, padding: '14px', textAlign: 'center',
        }}>
          <span className="badge badge-success" style={{ marginBottom: 8, display: 'inline-flex' }}>
            Early Warning Confirmed
          </span>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--fg)', marginTop: 8 }}>
            +{leadTime} steps
          </div>
          <p style={{ fontSize: '12px', color: 'var(--fg-dim)', marginTop: 4 }}>
            Topology led classical detector
          </p>
          <div className="separator" />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--fg-faint)', marginBottom: 2 }}>Topo</div>
              <div className="mono" style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
                #{topoAlarmStep}
                {topoSnap && <span style={{ color: 'var(--fg-faint)' }}> T={topoSnap.temperature.toFixed(2)}</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--fg-faint)', marginBottom: 2 }}>Classical</div>
              <div className="mono" style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
                #{classicalAlarmStep}
                {classicalSnap && <span style={{ color: 'var(--fg-faint)' }}> T={classicalSnap.temperature.toFixed(2)}</span>}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{
        background: 'var(--accent)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '14px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>
          Classical detector matched topology this run.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--fg-faint)', marginTop: 4 }}>
          Try increasing lattice size or reducing sweeps/step.
        </p>
      </div>
    )
  }

  return null
}
