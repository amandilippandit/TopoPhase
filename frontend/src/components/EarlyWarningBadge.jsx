import React from 'react'
import useSimStore from '../store/useSimStore'

const pulseStyle = `
@keyframes scale-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
`

export default function EarlyWarningBadge() {
  const { topoAlarmStep, classicalAlarmStep, leadTime, snapshots } = useSimStore()

  const topoSnap = topoAlarmStep != null
    ? snapshots.find(s => s.step === topoAlarmStep)
    : null
  const classicalSnap = classicalAlarmStep != null
    ? snapshots.find(s => s.step === classicalAlarmStep)
    : null

  if (topoAlarmStep == null && classicalAlarmStep == null) {
    return (
      <div style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
        Waiting for phase transition...
      </div>
    )
  }

  if (topoAlarmStep != null && classicalAlarmStep == null) {
    return (
      <>
        <style>{pulseStyle}</style>
        <div style={{
          background: '#92400e',
          color: '#fef3c7',
          borderRadius: '8px',
          padding: '14px',
          textAlign: 'center',
          animation: 'scale-pulse 2s infinite',
        }}>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', marginBottom: '6px' }}>
            TOPOLOGICAL EARLY WARNING
          </div>
          <div style={{ fontSize: '12px' }}>
            Topology detected transition at step {topoAlarmStep}
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
            Classical magnetization has not yet confirmed — watching...
          </div>
        </div>
      </>
    )
  }

  if (topoAlarmStep != null && classicalAlarmStep != null) {
    if (leadTime > 0) {
      return (
        <>
          <style>{pulseStyle}</style>
          <div style={{
            background: '#065f46',
            color: '#d1fae5',
            borderRadius: '8px',
            padding: '14px',
            textAlign: 'center',
            animation: 'scale-pulse 2s infinite',
          }}>
            <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', marginBottom: '6px' }}>
              TOPOLOGICAL EARLY WARNING CONFIRMED
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>
              Topology fired {leadTime} steps before classical detector
            </div>
            <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.85 }}>
              Topo alarm: step {topoAlarmStep} | Classical alarm: step {classicalAlarmStep}
            </div>
            {topoSnap && classicalSnap && (
              <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.75 }}>
                T at topo alarm: {topoSnap.temperature.toFixed(3)} | T at classical: {classicalSnap.temperature.toFixed(3)}
              </div>
            )}
          </div>
        </>
      )
    }

    return (
      <div style={{
        background: '#374151',
        color: '#d1d5db',
        borderRadius: '8px',
        padding: '14px',
        textAlign: 'center',
      }}>
        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
          Classical detector was equally fast this run
        </div>
        <div style={{ fontSize: '11px', opacity: 0.8 }}>
          Consider increasing sweeps_per_step or lattice size for clearer separation
        </div>
      </div>
    )
  }

  return null
}
