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
    const gap = Math.max(1, cell * 0.08)

    svg.attr('width', size).attr('height', size + 28)

    const g = svg.append('g')

    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        const up = lattice[row][col] > 0
        g.append('rect')
          .attr('x', col * cell + gap / 2)
          .attr('y', row * cell + gap / 2)
          .attr('width', cell - gap)
          .attr('height', cell - gap)
          .attr('rx', 2)
          .attr('fill', up ? '#fafafa' : '#27272a')
      }
    }

    if (snapshot.classical_alarm) {
      g.append('rect')
        .attr('x', -1).attr('y', -1)
        .attr('width', size + 2).attr('height', size + 2)
        .attr('fill', 'none').attr('stroke', '#ef4444').attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5).attr('rx', 6)
    }

    // Magnetization bar
    const barY = size + 10
    const mag = snapshot.magnetization
    g.append('rect').attr('x', 0).attr('y', barY).attr('width', size).attr('height', 6)
      .attr('fill', '#18181b').attr('rx', 9999)
    g.append('rect').attr('x', 0).attr('y', barY).attr('width', size * mag).attr('height', 6)
      .attr('fill', '#a1a1aa').attr('rx', 9999)
      .style('transition', 'width 0.3s ease')
    g.append('text').attr('x', size / 2).attr('y', barY + 18)
      .attr('text-anchor', 'middle').attr('fill', '#71717a').attr('font-size', '11px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text(`M = ${mag.toFixed(3)}`)
  }, [snapshot])

  if (!snapshot) {
    return (
      <div style={{ width: 280, height: 308, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--fg-faint)', fontSize: '13px' }}>Awaiting simulation...</span>
      </div>
    )
  }

  return <svg ref={svgRef} />
}
