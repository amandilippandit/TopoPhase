import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import useSimStore from '../store/useSimStore'

const tip = {
  background: '#09090b', border: '1px solid #27272a',
  borderRadius: 8, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)', padding: '8px 12px',
}

export default function BettiTimeline({ snapshots }) {
  const { topoAlarmStep, classicalAlarmStep } = useSimStore()
  const data = snapshots.map(s => ({ step: s.step, beta0: s.beta0, beta1: s.beta1, temperature: s.temperature }))

  if (!data.length) {
    return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-faint)', fontSize: '13px' }}>Awaiting data...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="step" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
        <YAxis stroke="#27272a" tick={{ fill: '#52525b', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
        <Tooltip contentStyle={tip} labelStyle={{ color: '#71717a', marginBottom: 4 }} itemStyle={{ color: '#fafafa', padding: '2px 0' }}
          labelFormatter={l => { const d = data.find(x => x.step === l); return d ? `Step ${l}  ·  T = ${d.temperature.toFixed(3)}` : `Step ${l}` }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#71717a', fontFamily: "'JetBrains Mono', monospace", paddingTop: 8 }} />
        <Line type="monotone" dataKey="beta0" name="beta-0" stroke="#fafafa" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="beta1" name="beta-1" stroke="#71717a" dot={false} strokeWidth={1.5} />
        {topoAlarmStep != null && (
          <ReferenceLine x={topoAlarmStep} stroke="#eab308" strokeDasharray="4 3"
            label={{ value: 'Topo', fill: '#eab308', fontSize: 10, position: 'top' }} />
        )}
        {classicalAlarmStep != null && (
          <ReferenceLine x={classicalAlarmStep} stroke="#ef4444" strokeDasharray="4 3"
            label={{ value: 'Classical', fill: '#ef4444', fontSize: 10, position: 'top' }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
