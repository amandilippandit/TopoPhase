import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import useSimStore from '../store/useSimStore'

const tooltipStyle = {
  background: 'rgba(13,14,20,0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  padding: '8px 12px',
}

export default function BettiTimeline({ snapshots }) {
  const { topoAlarmStep, classicalAlarmStep } = useSimStore()

  const data = snapshots.map((s) => ({
    step: s.step,
    beta0: s.beta0,
    beta1: s.beta1,
    temperature: s.temperature,
  }))

  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>Awaiting data...</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="step" stroke="rgba(255,255,255,0.06)" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
        <YAxis stroke="rgba(255,255,255,0.06)" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}
          itemStyle={{ color: '#c8cad0', padding: '1px 0' }}
          labelFormatter={(label) => {
            const item = data.find(d => d.step === label)
            return item ? `Step ${label}  T=${item.temperature.toFixed(3)}` : `Step ${label}`
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }} />
        <Line type="monotone" dataKey="beta0" name="beta0" stroke="#6366f1" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="beta1" name="beta1" stroke="#f47252" dot={false} strokeWidth={1.5} />
        {topoAlarmStep != null && (
          <ReferenceLine x={topoAlarmStep} stroke="rgba(167,139,250,0.5)" strokeDasharray="4 2"
            label={{ value: 'Topo', fill: 'rgba(167,139,250,0.6)', fontSize: 9, position: 'top' }} />
        )}
        {classicalAlarmStep != null && (
          <ReferenceLine x={classicalAlarmStep} stroke="rgba(239,68,68,0.5)"
            label={{ value: 'Classical', fill: 'rgba(239,68,68,0.6)', fontSize: 9, position: 'top' }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
