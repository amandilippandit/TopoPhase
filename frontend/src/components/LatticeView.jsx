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
    const size = 260
    const cell = size / N
    const gap = Math.max(1, cell * 0.08)

    svg.attr('width', size).attr('height', size + 32)

    const g = svg.append('g')

    const alarm = snapshot.classical_alarm
    if (alarm) {
      g.append('rect')
        .attr('x', -3).attr('y', -3)
        .attr('width', size + 6).attr('height', size + 6)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(239,68,68,0.4)')
        .attr('stroke-width', 1.5)
        .attr('rx', 10)
        .style('animation', 'glow-pulse 2s ease-in-out infinite')
    }

    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        const up = lattice[row][col] > 0
        g.append('rect')
          .attr('x', col * cell + gap / 2)
          .attr('y', row * cell + gap / 2)
          .attr('width', cell - gap)
          .attr('height', cell - gap)
          .attr('rx', Math.min(3, cell * 0.15))
          .attr('fill', up ? '#a78bfa' : '#1e1b2e')
          .attr('opacity', up ? 0.85 : 0.5)
      }
    }

    // Magnetization bar
    const barY = size + 12
    const mag = snapshot.magnetization

    g.append('rect')
      .attr('x', 0).attr('y', barY)
      .attr('width', size).attr('height', 6)
      .attr('fill', 'rgba(255,255,255,0.04)').attr('rx', 3)

    const barGrad = svg.append('defs').append('linearGradient')
      .attr('id', 'mag-grad').attr('x1', '0%').attr('x2', '100%')
    barGrad.append('stop').attr('offset', '0%').attr('stop-color', '#7c3aed')
    barGrad.append('stop').attr('offset', '100%').attr('stop-color', '#a78bfa')

    g.append('rect')
      .attr('x', 0).attr('y', barY)
      .attr('width', size * mag).attr('height', 6)
      .attr('fill', 'url(#mag-grad)').attr('rx', 3)
      .style('transition', 'width 0.3s ease')

    g.append('text')
      .attr('x', size / 2).attr('y', barY + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.3)')
      .attr('font-size', '10px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text(`M = ${mag.toFixed(3)}`)
  }, [snapshot])

  if (!snapshot) {
    return (
      <div style={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>Awaiting simulation...</span>
      </div>
    )
  }

  return <svg ref={svgRef} />
}
