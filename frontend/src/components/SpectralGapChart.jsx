import React from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

export default function SpectralGapChart({ snapshots }) {
  const data = snapshots.map((s) => ({
    step: s.step,
    fiedler: s.fiedler,
    wasserstein: s.wasserstein,
  }))

  return (
    <div>
      <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>
        Spectral gap and topological distance
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data}>
          <XAxis dataKey="step" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }}
            label={{ value: 'Step', position: 'insideBottom', offset: -4, fill: '#6b7280', fontSize: 11 }} />
          <YAxis yAxisId="left" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }}
            label={{ value: 'Fiedler', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }}
            label={{ value: 'Wasserstein', angle: 90, position: 'insideRight', fill: '#6b7280', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#9ca3af' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area yAxisId="left" type="monotone" dataKey="fiedler" name="Fiedler"
            fill="#B5D4F4" fillOpacity={0.3} stroke="#378ADD" strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="wasserstein" name="Wasserstein"
            stroke="#EF9F27" dot={false} strokeWidth={2} />
          <ReferenceLine yAxisId="left" y={0.01} stroke="#ef4444" strokeDasharray="3 3"
            label={{ value: 'Connectivity lost', fill: '#ef4444', fontSize: 10, position: 'right' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
