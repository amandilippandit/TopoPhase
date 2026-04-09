import React from 'react'

const phaseStyles = {
  ordered:    { bg: '#071a12', border: '#0d2e1f', color: '#34d399' },
  critical:   { bg: '#1a1508', border: '#2e250d', color: '#fbbf24' },
  disordered: { bg: '#1a0808', border: '#2e0d0d', color: '#f87171' },
}

export default function PhaseAlertPanel({ snapshot }) {
  if (!snapshot) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#2d3748', fontSize: '11px' }}>Awaiting classification...</span>
      </div>
    )
  }

  const { phase, phase_probs, transition_prob, temperature, magnetization } = snapshot
  const ps = phaseStyles[phase] || phaseStyles.disordered

  return (
    <div>
      {/* Phase badge */}
      <div style={{
        background: ps.bg, border: `1px solid ${ps.border}`,
        borderRadius: '8px', padding: '20px 16px', textAlign: 'center', marginBottom: '14px',
      }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: ps.color, textTransform: 'uppercase', letterSpacing: '3px' }}>
          {phase}
        </div>
        <div className="mono" style={{ fontSize: '10px', color: '#3d4759', marginTop: '6px' }}>
          T = {temperature.toFixed(3)} J/k_B
        </div>
      </div>

      {/* Transition probability */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '10px', color: '#3d4759' }}>Transition probability</span>
          <span className="mono" style={{ fontSize: '10px', color: transition_prob > 0.5 ? '#f87171' : '#5a6378' }}>
            {(transition_prob * 100).toFixed(1)}%
          </span>
        </div>
        <div style={{ height: '3px', background: '#111828', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            width: `${transition_prob * 100}%`, height: '100%',
            background: transition_prob > 0.7 ? '#ef4444' : transition_prob > 0.4 ? '#eab308' : '#1d4ed8',
            borderRadius: '2px', transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Bottom stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <div style={{ background: '#0d1526', border: '1px solid #141d2f', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '8px', color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Magnetization</div>
          <div className="mono" style={{ fontSize: '12px', color: '#8b92a5' }}>{magnetization.toFixed(4)}</div>
        </div>
        <div style={{ background: '#0d1526', border: '1px solid #141d2f', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '8px', color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Temperature</div>
          <div className="mono" style={{ fontSize: '12px', color: '#8b92a5' }}>{temperature.toFixed(4)}</div>
        </div>
      </div>
    </div>
  )
}
