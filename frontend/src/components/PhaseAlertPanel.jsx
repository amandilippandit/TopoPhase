import React from 'react'

const phaseConfig = {
  ordered: {
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.12)',
    color: '#34d399',
    glow: 'rgba(16,185,129,0.15)',
  },
  critical: {
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.12)',
    color: '#fbbf24',
    glow: 'rgba(245,158,11,0.15)',
  },
  disordered: {
    bg: 'rgba(239,68,68,0.05)',
    border: 'rgba(239,68,68,0.1)',
    color: '#f87171',
    glow: 'rgba(239,68,68,0.1)',
  },
}

const barAccent = ['#6366f1', '#a78bfa', '#f47252']

export default function PhaseAlertPanel({ snapshot }) {
  if (!snapshot) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>
        Awaiting classification...
      </div>
    )
  }

  const { phase, phase_probs, transition_prob, temperature, magnetization } = snapshot
  const cfg = phaseConfig[phase] || phaseConfig.disordered
  const labels = ['Ordered', 'Critical', 'Disordered']
  const pulsing = transition_prob > 0.8

  return (
    <div>
      {pulsing && (
        <style>{`
          @keyframes critical-glow {
            0%, 100% { box-shadow: 0 0 20px ${cfg.glow}; }
            50% { box-shadow: 0 0 40px ${cfg.glow}, 0 0 60px ${cfg.glow}; }
          }
        `}</style>
      )}

      {/* Phase name */}
      <div style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        marginBottom: '16px',
        animation: pulsing ? 'critical-glow 2s ease-in-out infinite' : 'none',
      }}>
        <div style={{
          fontSize: '24px', fontWeight: 700, color: cfg.color,
          textTransform: 'uppercase', letterSpacing: '3px',
        }}>
          {phase}
        </div>
      </div>

      {/* Probability bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {labels.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '70px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${(phase_probs[i] * 100).toFixed(1)}%`,
                height: '100%',
                background: barAccent[i],
                borderRadius: '2px',
                transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: phase_probs[i] > 0.5 ? `0 0 8px ${barAccent[i]}40` : 'none',
              }} />
            </div>
            <span className="mono" style={{ width: '40px', textAlign: 'right', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
              {(phase_probs[i] * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* Transition bar */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Transition probability</span>
          <span className="mono" style={{ fontSize: '10px', color: transition_prob > 0.5 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
            {(transition_prob * 100).toFixed(1)}%
          </span>
        </div>
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            width: `${(transition_prob * 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #a78bfa, #f47252)',
            borderRadius: '2px',
            transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* Bottom stats */}
      <div style={{
        marginTop: '14px', display: 'flex', justifyContent: 'space-between',
        paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span className="mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
          T = {temperature.toFixed(3)}
        </span>
        <span className="mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
          M = {magnetization.toFixed(3)}
        </span>
      </div>
    </div>
  )
}
