import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function PersistenceDiagram({ snapshot }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!snapshot || !snapshot.persistence) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 260, height = 260
    const margin = { top: 8, right: 16, bottom: 36, left: 36 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom

    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([0, 2]).range([0, w])
    const y = d3.scaleLinear().domain([0, 2]).range([h, 0])

    // Grid lines
    const gridVals = [0.5, 1.0, 1.5]
    gridVals.forEach(v => {
      g.append('line').attr('x1', x(v)).attr('y1', 0).attr('x2', x(v)).attr('y2', h)
        .attr('stroke', 'rgba(255,255,255,0.03)')
      g.append('line').attr('x1', 0).attr('y1', y(v)).attr('x2', w).attr('y2', y(v))
        .attr('stroke', 'rgba(255,255,255,0.03)')
    })

    // Axes
    const axisStyle = { fill: 'rgba(255,255,255,0.25)', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace" }
    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(4).tickSize(0).tickPadding(6))
      .call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.06)'))
      .selectAll('text').attr('fill', axisStyle.fill).attr('font-size', axisStyle.fontSize)
        .attr('font-family', axisStyle.fontFamily)

    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(6))
      .call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.06)'))
      .selectAll('text').attr('fill', axisStyle.fill).attr('font-size', axisStyle.fontSize)
        .attr('font-family', axisStyle.fontFamily)

    g.append('text').attr('x', w / 2).attr('y', h + 28)
      .attr('text-anchor', 'middle').attr('fill', 'rgba(255,255,255,0.2)')
      .attr('font-size', '10px').text('Birth')
    g.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -h / 2).attr('y', -26)
      .attr('text-anchor', 'middle').attr('fill', 'rgba(255,255,255,0.2)')
      .attr('font-size', '10px').text('Death')

    // Diagonal
    g.append('line')
      .attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(2)).attr('y2', y(2))
      .attr('stroke', 'rgba(255,255,255,0.06)').attr('stroke-dasharray', '3 3')

    // Tooltip
    const tooltip = d3.select('body').selectAll('.pd-tooltip').data([0])
      .join('div').attr('class', 'pd-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(13,14,20,0.95)')
      .style('backdrop-filter', 'blur(12px)')
      .style('color', '#c8cad0')
      .style('padding', '8px 12px')
      .style('border-radius', '8px')
      .style('font-size', '11px')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('border', '1px solid rgba(255,255,255,0.08)')
      .style('box-shadow', '0 8px 32px rgba(0,0,0,0.4)')
      .style('z-index', '1000')

    const points = snapshot.persistence

    // Glow defs
    const defs = svg.append('defs')
    const filter0 = defs.append('filter').attr('id', 'glow-h0')
    filter0.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    filter0.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).join('feMergeNode').attr('in', d => d)
    const filter1 = defs.append('filter').attr('id', 'glow-h1')
    filter1.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    filter1.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).join('feMergeNode').attr('in', d => d)

    g.selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => x(d.birth))
      .attr('cy', d => y(d.death))
      .attr('r', d => Math.min(3 + (d.death - d.birth) * 8, 10))
      .attr('fill', d => d.dim === 0 ? 'rgba(99,102,241,0.7)' : 'rgba(244,114,82,0.7)')
      .attr('filter', d => d.dim === 0 ? 'url(#glow-h0)' : 'url(#glow-h1)')
      .on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`H${d.dim}  b=${d.birth.toFixed(3)}  d=${d.death.toFixed(3)}  p=${(d.death - d.birth).toFixed(3)}`)
          .style('left', (event.pageX + 14) + 'px')
          .style('top', (event.pageY - 14) + 'px')
      })
      .on('mouseout', () => tooltip.style('opacity', 0))

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${width - 70}, ${height - 12})`)
    legend.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 3).attr('fill', 'rgba(99,102,241,0.7)')
    legend.append('text').attr('x', 7).attr('y', 3).attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', '9px').text('H0')
    legend.append('circle').attr('cx', 32).attr('cy', 0).attr('r', 3).attr('fill', 'rgba(244,114,82,0.7)')
    legend.append('text').attr('x', 39).attr('y', 3).attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', '9px').text('H1')
  }, [snapshot])

  if (!snapshot) {
    return (
      <div style={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>Awaiting data...</span>
      </div>
    )
  }

  return <svg ref={svgRef} />
}
