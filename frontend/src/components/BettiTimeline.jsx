import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import useSimStore from '../store/useSimStore'

export default function BettiTimeline({ snapshots }) {
  const { topoAlarmStep, classicalAlarmStep } = useSimStore()

  const data = snapshots.map((s) => ({
    step: s.step,
    beta0: s.beta0,
    beta1: s.beta1,
    temperature: s.temperature,
  }))

  return (
    <div>
      <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>
        Betti numbers vs simulation step
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="step" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }}
            label={{ value: 'MC step', position: 'insideBottom', offset: -4, fill: '#6b7280', fontSize: 11 }} />
          <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }}
            label={{ value: 'Betti number', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(val, name, props) => {
              const item = props.payload
              return [val, name]
            }}
            labelFormatter={(label) => {
              const item = data.find(d => d.step === label)
              return item ? `Step ${label} (T=${item.temperature.toFixed(3)})` : `Step ${label}`
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="beta0" name="beta0" stroke="#378ADD" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="beta1" name="beta1" stroke="#D85A30" dot={false} strokeWidth={2} />
          {topoAlarmStep != null && (
            <ReferenceLine x={topoAlarmStep} stroke="#EF9F27" strokeDasharray="4 2"
              label={{ value: 'Topo alarm', fill: '#EF9F27', fontSize: 10, position: 'top' }} />
          )}
          {classicalAlarmStep != null && (
            <ReferenceLine x={classicalAlarmStep} stroke="#ef4444"
              label={{ value: 'Classical alarm', fill: '#ef4444', fontSize: 10, position: 'top' }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
