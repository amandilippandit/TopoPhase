import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function LatticeView({ snapshot }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!snapshot || !snapshot.lattice) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const lattice = snapshot.lattice
    const N = lattice.length
    const size = 300
    const cell = size / N
    const margin = { top: 28, left: 0 }

    svg.attr('width', size).attr('height', size + margin.top + 30)

    svg.append('text')
      .attr('x', size / 2)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '13px')
      .text(`Spin configuration — T=${snapshot.temperature.toFixed(3)}`)

    const g = svg.append('g').attr('transform', `translate(0,${margin.top})`)

    const alarm = snapshot.classical_alarm
    if (alarm) {
      g.append('rect')
        .attr('x', -2).attr('y', -2)
        .attr('width', size + 4).attr('height', size + 4)
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('rx', 4)
        .style('animation', 'pulse-border 1s infinite')
    }

    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        g.append('rect')
          .attr('x', col * cell)
          .attr('y', row * cell)
          .attr('width', cell - 0.5)
          .attr('height', cell - 0.5)
          .attr('fill', lattice[row][col] > 0 ? '#E24B4A' : '#378ADD')
      }
    }

    const barY = size + 6
    const mag = snapshot.magnetization
    const barWidth = size * mag
    const color = d3.interpolateRdBu(1 - mag)

    g.append('rect')
      .attr('x', 0).attr('y', barY)
      .attr('width', size).attr('height', 10)
      .attr('fill', '#2a2d35').attr('rx', 3)

    g.append('rect')
      .attr('x', 0).attr('y', barY)
      .attr('width', barWidth).attr('height', 10)
      .attr('fill', color).attr('rx', 3)

    g.append('text')
      .attr('x', size / 2).attr('y', barY + 22)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af').attr('font-size', '11px')
      .text(`M = ${mag.toFixed(3)}`)
  }, [snapshot])

  return (
    <>
      <style>{`
        @keyframes pulse-border {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <svg ref={svgRef} />
    </>
  )
}
