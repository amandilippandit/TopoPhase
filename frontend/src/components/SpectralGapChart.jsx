import React from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

const tip = {
  background: '#09090b', border: '1px solid #27272a',
  borderRadius: 8, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)', padding: '8px 12px',
}

export default function SpectralGapChart({ snapshots }) {
  const data = snapshots.map(s => ({ step: s.step, fiedler: s.fiedler, wasserstein: s.wasserstein }))

  if (!data.length) {
    return <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-faint)', fontSize: '13px' }}>Awaiting data...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={190}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="fiedler-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fafafa" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#fafafa" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <XAxis dataKey="step" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
        <YAxis yAxisId="left" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
        <Tooltip contentStyle={tip} labelStyle={{ color: '#71717a' }} itemStyle={{ color: '#fafafa', padding: '2px 0' }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#71717a', fontFamily: "'JetBrains Mono', monospace", paddingTop: 8 }} />
        <Area yAxisId="left" type="monotone" dataKey="fiedler" name="Fiedler" fill="url(#fiedler-fill)" stroke="#fafafa" strokeWidth={1.5} />
        <Line yAxisId="right" type="monotone" dataKey="wasserstein" name="Wasserstein" stroke="#71717a" dot={false} strokeWidth={1} strokeDasharray="4 3" />
        <ReferenceLine yAxisId="left" y={0.01} stroke="#ef4444" strokeOpacity={0.3} strokeDasharray="4 3" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
