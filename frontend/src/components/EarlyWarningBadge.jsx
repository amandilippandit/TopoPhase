import React from 'react'
import useSimStore from '../store/useSimStore'

const css = `
  @keyframes warning-blink { 0%,100%{opacity:1} 50%{opacity:0.5} }
`

export default function EarlyWarningBadge() {
  const { topoAlarmStep, classicalAlarmStep, leadTime, snapshots } = useSimStore()
  const topoSnap = topoAlarmStep != null ? snapshots.find(s => s.step === topoAlarmStep) : null
  const classicalSnap = classicalAlarmStep != null ? snapshots.find(s => s.step === classicalAlarmStep) : null

  // Waiting state
  if (topoAlarmStep == null && classicalAlarmStep == null) {
    return (
      <div style={{ textAlign: 'center', padding: '6px 0', color: '#2d3748', fontSize: '11px' }}>
        Monitoring...
      </div>
    )
  }

  // Topo fired, classical hasn't
  if (topoAlarmStep != null && classicalAlarmStep == null) {
    return (
      <>
        <style>{css}</style>
        <div style={{
          background: '#1a1508', border: '1px solid #2e250d', borderRadius: '8px',
          padding: '12px', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '6px' }}>
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%', background: '#eab308',
              animation: 'warning-blink 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontWeight: 600, fontSize: '9px', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#eab308' }}>
              Topological Warning
            </span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: '#8b6e14' }}>
            Detected at step {topoAlarmStep}
          </div>
          <div style={{ fontSize: '9px', color: '#3d4759', marginTop: '3px' }}>
            Awaiting classical confirmation
          </div>
        </div>
      </>
    )
  }

  // Both fired
  if (topoAlarmStep != null && classicalAlarmStep != null) {
    if (leadTime > 0) {
      return (
        <div style={{
          background: '#071a12', border: '1px solid #0d2e1f', borderRadius: '8px',
          padding: '12px', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '6px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontWeight: 600, fontSize: '9px', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#22c55e' }}>
              Confirmed
            </span>
          </div>
          <div className="mono" style={{ fontSize: '18px', color: '#c8cdd8', fontWeight: 700, margin: '4px 0' }}>
            +{leadTime} steps
          </div>
          <div style={{ fontSize: '9px', color: '#3d4759', marginBottom: '8px' }}>
            Topology led classical detector
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', borderTop: '1px solid #0d2e1f', paddingTop: '8px' }}>
            <div>
              <div style={{ fontSize: '8px', color: '#2d3748', marginBottom: '2px' }}>Topo</div>
              <div className="mono" style={{ fontSize: '9px', color: '#3b82f6' }}>
                #{topoAlarmStep}{topoSnap ? ` T=${topoSnap.temperature.toFixed(2)}` : ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '8px', color: '#2d3748', marginBottom: '2px' }}>Classical</div>
              <div className="mono" style={{ fontSize: '9px', color: '#f47252' }}>
                #{classicalAlarmStep}{classicalSnap ? ` T=${classicalSnap.temperature.toFixed(2)}` : ''}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{
        background: '#0d1526', border: '1px solid #141d2f', borderRadius: '8px',
        padding: '12px', textAlign: 'center',
      }}>
        <span style={{ fontWeight: 500, fontSize: '10px', color: '#5a6378' }}>
          Classical detector matched topology
        </span>
        <div style={{ fontSize: '9px', color: '#2d3748', marginTop: '3px' }}>
          Try larger N or fewer sweeps/step
        </div>
      </div>
    )
  }

  return null
}
