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
    const size = 280
    const cell = size / N
    const gap = Math.max(0.8, cell * 0.06)

    svg.attr('width', size).attr('height', size + 36)

    // Title
    svg.append('text')
      .attr('x', size / 2).attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#3d4759').attr('font-size', '10px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text(`T = ${snapshot.temperature.toFixed(3)}`)

    const g = svg.append('g').attr('transform', 'translate(0, 18)')

    // Grid cells
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        const up = lattice[row][col] > 0
        g.append('rect')
          .attr('x', col * cell + gap / 2)
          .attr('y', row * cell + gap / 2)
          .attr('width', cell - gap)
          .attr('height', cell - gap)
          .attr('rx', 1)
          .attr('fill', up ? '#1d4ed8' : '#0a0f1c')
          .attr('opacity', up ? 0.9 : 0.6)
      }
    }

    // Alarm border
    if (snapshot.classical_alarm) {
      g.append('rect')
        .attr('x', -1).attr('y', -1)
        .attr('width', size + 2).attr('height', size + 2)
        .attr('fill', 'none').attr('stroke', 'rgba(239,68,68,0.3)')
        .attr('stroke-width', 1).attr('rx', 4)
    }

    // Magnetization bar
    const barY = size + 6
    const mag = snapshot.magnetization
    g.append('rect').attr('x', 0).attr('y', barY).attr('width', size).attr('height', 3)
      .attr('fill', '#111828').attr('rx', 1.5)
    g.append('rect').attr('x', 0).attr('y', barY).attr('width', size * mag).attr('height', 3)
      .attr('fill', '#1d4ed8').attr('rx', 1.5)
    g.append('text').attr('x', size / 2).attr('y', barY + 14)
      .attr('text-anchor', 'middle').attr('fill', '#3d4759').attr('font-size', '9px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text(`M = ${mag.toFixed(3)}`)
  }, [snapshot])

  if (!snapshot) {
    return (
      <div style={{ width: 280, height: 316, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#2d3748', fontSize: '11px' }}>Awaiting simulation...</span>
      </div>
    )
  }

  return <svg ref={svgRef} />
}
