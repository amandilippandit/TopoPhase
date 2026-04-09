import React from 'react'

export default function PhaseAlertPanel({ snapshot }) {
  if (!snapshot) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
        <span style={{ color: 'var(--fg-faint)', fontSize: '13px' }}>Awaiting classification...</span>
      </div>
    )
  }

  const { phase, phase_probs, transition_prob, temperature, magnetization } = snapshot
  const badgeClass = phase === 'ordered' ? 'badge-success' : phase === 'critical' ? 'badge-warning' : 'badge-destructive'

  return (
    <div>
      {/* Phase */}
      <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
        <div style={{
          fontSize: '28px', fontWeight: 600, color: 'var(--fg)',
          textTransform: 'uppercase', letterSpacing: '2px', lineHeight: 1,
        }}>
          {phase}
        </div>
        <div className="mono" style={{ fontSize: '12px', color: 'var(--fg-dim)', marginTop: 8 }}>
          T = {temperature.toFixed(3)} J/k<sub>B</sub>
        </div>
      </div>

      {/* Prob bars */}
      {['Ordered', 'Critical', 'Disordered'].map((name, i) => {
        const pct = phase_probs[i] * 100
        return (
          <div key={name} style={{ marginBottom: i < 2 ? 10 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>{name}</span>
              <span className="mono" style={{ fontSize: '12px', color: 'var(--fg)' }}>{pct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--accent)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 9999,
                background: 'var(--fg)',
                opacity: pct > 50 ? 0.9 : 0.3,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )
      })}

      <div className="separator" />

      {/* Transition */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>Transition prob.</span>
        <span className={`badge ${transition_prob > 0.5 ? 'badge-destructive' : 'badge-default'}`}>
          {(transition_prob * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
