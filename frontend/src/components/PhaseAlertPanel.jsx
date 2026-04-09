import React from 'react'

const phaseColors = {
  ordered: '#E1F5EE',
  critical: '#FAEEDA',
  disordered: '#FCEBEB',
}
const phaseTextColors = {
  ordered: '#065f46',
  critical: '#92400e',
  disordered: '#991b1b',
}

export default function PhaseAlertPanel({ snapshot }) {
  if (!snapshot) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Waiting for simulation data...
      </div>
    )
  }

  const { phase, phase_probs, transition_prob, temperature, magnetization } = snapshot
  const bg = phaseColors[phase] || '#1f2937'
  const textColor = phaseTextColors[phase] || '#e0e0e0'
  const pulsing = transition_prob > 0.8

  const labels = ['Ordered', 'Critical', 'Disordered']
  const barColors = ['#10b981', '#f59e0b', '#ef4444']

  return (
    <div style={{ position: 'relative' }}>
      {pulsing && (
        <style>{`
          @keyframes pulse-panel { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
        `}</style>
      )}
      <div style={{
        background: bg,
        borderRadius: '8px',
        padding: '16px',
        animation: pulsing ? 'pulse-panel 1s infinite' : 'none',
        border: pulsing ? '2px solid #ef4444' : '1px solid transparent',
      }}>
        <div style={{
          fontSize: '32px',
          fontWeight: 700,
          textAlign: 'center',
          color: textColor,
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          {phase}
        </div>

        <div style={{ marginTop: '12px' }}>
          {labels.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ width: '80px', fontSize: '12px', color: '#374151' }}>{label}</span>
              <div style={{ flex: 1, height: '12px', background: '#d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(phase_probs[i] * 100).toFixed(1)}%`,
                  height: '100%',
                  background: barColors[i],
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ width: '44px', textAlign: 'right', fontSize: '11px', color: '#374151' }}>
                {(phase_probs[i] * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
            Transition probability: {(transition_prob * 100).toFixed(1)}%
          </div>
          <div style={{ height: '8px', background: '#d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${(transition_prob * 100).toFixed(1)}%`,
              height: '100%',
              background: `linear-gradient(90deg, #10b981, #f59e0b ${50}%, #ef4444)`,
              borderRadius: '4px',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563' }}>
          <span>T = {temperature.toFixed(3)} J/k_B</span>
          <span>M = {magnetization.toFixed(3)}</span>
        </div>
      </div>
    </div>
  )
}
