import React from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

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

export default function SpectralGapChart({ snapshots }) {
  const data = snapshots.map((s) => ({
    step: s.step,
    fiedler: s.fiedler,
    wasserstein: s.wasserstein,
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
      <ComposedChart data={data}>
        <XAxis dataKey="step" stroke="rgba(255,255,255,0.06)" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
        <YAxis yAxisId="left" stroke="rgba(255,255,255,0.06)" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.06)" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
          itemStyle={{ color: '#c8cad0', padding: '1px 0' }} />
        <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }} />
        <defs>
          <linearGradient id="fiedler-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area yAxisId="left" type="monotone" dataKey="fiedler" name="Fiedler"
          fill="url(#fiedler-gradient)" stroke="#6366f1" strokeWidth={1.5} />
        <Line yAxisId="right" type="monotone" dataKey="wasserstein" name="Wasserstein"
          stroke="#a78bfa" dot={false} strokeWidth={1.5} strokeDasharray="3 2" />
        <ReferenceLine yAxisId="left" y={0.01} stroke="rgba(239,68,68,0.25)" strokeDasharray="3 3"
          label={{ value: 'Disconnected', fill: 'rgba(239,68,68,0.4)', fontSize: 9, position: 'right' }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
