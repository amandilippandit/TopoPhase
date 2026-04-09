import React from 'react'
import useSimStore from '../store/useSimStore'

const css = `
  @keyframes badge-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.92; transform: scale(1.01); }
  }
  @keyframes dot-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`

export default function EarlyWarningBadge() {
  const { topoAlarmStep, classicalAlarmStep, leadTime, snapshots } = useSimStore()

  const topoSnap = topoAlarmStep != null
    ? snapshots.find(s => s.step === topoAlarmStep) : null
  const classicalSnap = classicalAlarmStep != null
    ? snapshots.find(s => s.step === classicalAlarmStep) : null

  if (topoAlarmStep == null && classicalAlarmStep == null) {
    return (
      <div style={{
        textAlign: 'center', padding: '12px 0',
        color: 'rgba(255,255,255,0.2)', fontSize: '12px',
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          margin: '0 auto 8px',
        }} />
        Monitoring for phase transition...
      </div>
    )
  }

  if (topoAlarmStep != null && classicalAlarmStep == null) {
    return (
      <>
        <style>{css}</style>
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: '12px',
          padding: '14px',
          textAlign: 'center',
          animation: 'badge-pulse 2.5s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#fbbf24',
              boxShadow: '0 0 8px rgba(251,191,36,0.5)',
              animation: 'dot-blink 1.5s ease-in-out infinite',
            }} />
            <span style={{
              fontWeight: 600, fontSize: '10px', letterSpacing: '1.5px',
              textTransform: 'uppercase', color: '#fbbf24',
            }}>
              Topological Warning
            </span>
          </div>
          <div className="mono" style={{ fontSize: '11px', color: 'rgba(251,191,36,0.7)' }}>
            Detected at step {topoAlarmStep}
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px', color: 'rgba(255,255,255,0.25)' }}>
            Awaiting classical confirmation...
          </div>
        </div>
      </>
    )
  }

  if (topoAlarmStep != null && classicalAlarmStep != null) {
    if (leadTime > 0) {
      return (
        <>
          <style>{css}</style>
          <div style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.12)',
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'center',
            animation: 'badge-pulse 3s ease-in-out infinite',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 8px rgba(52,211,153,0.5)',
              }} />
              <span style={{
                fontWeight: 600, fontSize: '10px', letterSpacing: '1.5px',
                textTransform: 'uppercase', color: '#34d399',
              }}>
                Early Warning Confirmed
              </span>
            </div>
            <div style={{
              fontSize: '20px', fontWeight: 700, color: '#e2e4e9',
              margin: '6px 0',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              +{leadTime} steps
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>
              Topology led classical detector
            </div>
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '16px',
              paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginBottom: '2px' }}>Topo</div>
                <div className="mono" style={{ fontSize: '10px', color: 'rgba(167,139,250,0.7)' }}>
                  #{topoAlarmStep}
                  {topoSnap && <span style={{ color: 'rgba(255,255,255,0.2)' }}> T={topoSnap.temperature.toFixed(2)}</span>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginBottom: '2px' }}>Classical</div>
                <div className="mono" style={{ fontSize: '10px', color: 'rgba(244,114,82,0.7)' }}>
                  #{classicalAlarmStep}
                  {classicalSnap && <span style={{ color: 'rgba(255,255,255,0.2)' }}> T={classicalSnap.temperature.toFixed(2)}</span>}
                </div>
              </div>
            </div>
          </div>
        </>
      )
    }

    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '14px',
        textAlign: 'center',
      }}>
        <span style={{ fontWeight: 500, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
          Classical detector matched topology
        </span>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
          Try larger N or fewer sweeps/step
        </div>
      </div>
    )
  }

  return null
}
