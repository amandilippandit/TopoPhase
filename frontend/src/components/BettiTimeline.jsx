import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import useSimStore from '../store/useSimStore'

const tip = {
  background: '#0b1222', border: '1px solid #141d2f',
  borderRadius: 6, fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)', padding: '6px 10px',
}

export default function BettiTimeline({ snapshots }) {
  const { topoAlarmStep, classicalAlarmStep } = useSimStore()
  const data = snapshots.map(s => ({ step: s.step, beta0: s.beta0, beta1: s.beta1, temperature: s.temperature }))

  if (!data.length) {
    return <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d3748', fontSize: '11px' }}>Awaiting data...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <XAxis dataKey="step" stroke="#141d2f" tick={{ fill: '#3d4759', fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#141d2f' }} tickLine={false} />
        <YAxis stroke="#141d2f" tick={{ fill: '#3d4759', fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#141d2f' }} tickLine={false} />
        <Tooltip contentStyle={tip} labelStyle={{ color: '#5a6378', marginBottom: 2 }} itemStyle={{ color: '#8b92a5', padding: '1px 0' }}
          labelFormatter={l => { const d = data.find(x => x.step === l); return d ? `Step ${l}  T=${d.temperature.toFixed(3)}` : `Step ${l}` }} />
        <Legend wrapperStyle={{ fontSize: 9, color: '#3d4759', fontFamily: "'JetBrains Mono', monospace" }} />
        <Line type="monotone" dataKey="beta0" name="beta-0" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="beta1" name="beta-1" stroke="#f47252" dot={false} strokeWidth={1.5} />
        {topoAlarmStep != null && (
          <ReferenceLine x={topoAlarmStep} stroke="#eab308" strokeDasharray="3 2"
            label={{ value: 'Topo', fill: '#eab308', fontSize: 8, position: 'top' }} />
        )}
        {classicalAlarmStep != null && (
          <ReferenceLine x={classicalAlarmStep} stroke="#ef4444" strokeDasharray="3 2"
            label={{ value: 'Classical', fill: '#ef4444', fontSize: 8, position: 'top' }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
