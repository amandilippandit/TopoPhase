import React from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

const tip = {
  background: '#0b1222', border: '1px solid #141d2f',
  borderRadius: 6, fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)', padding: '6px 10px',
}

export default function SpectralGapChart({ snapshots }) {
  const data = snapshots.map(s => ({ step: s.step, fiedler: s.fiedler, wasserstein: s.wasserstein }))

  if (!data.length) {
    return <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d3748', fontSize: '11px' }}>Awaiting data...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={170}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="fiedler-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="step" stroke="#141d2f" tick={{ fill: '#3d4759', fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#141d2f' }} tickLine={false} />
        <YAxis yAxisId="left" stroke="#141d2f" tick={{ fill: '#3d4759', fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#141d2f' }} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" stroke="#141d2f" tick={{ fill: '#3d4759', fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#141d2f' }} tickLine={false} />
        <Tooltip contentStyle={tip} labelStyle={{ color: '#5a6378' }} itemStyle={{ color: '#8b92a5', padding: '1px 0' }} />
        <Legend wrapperStyle={{ fontSize: 9, color: '#3d4759', fontFamily: "'JetBrains Mono', monospace" }} />
        <Area yAxisId="left" type="monotone" dataKey="fiedler" name="Fiedler" fill="url(#fiedler-fill)" stroke="#3b82f6" strokeWidth={1.5} />
        <Line yAxisId="right" type="monotone" dataKey="wasserstein" name="Wasserstein" stroke="#eab308" dot={false} strokeWidth={1} strokeDasharray="3 2" />
        <ReferenceLine yAxisId="left" y={0.01} stroke="rgba(239,68,68,0.2)" strokeDasharray="3 3" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
