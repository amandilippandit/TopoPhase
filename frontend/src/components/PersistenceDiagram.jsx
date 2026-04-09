import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function PersistenceDiagram({ snapshot }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!snapshot || !snapshot.persistence) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 240, height = 240
    const margin = { top: 4, right: 12, bottom: 32, left: 32 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom

    svg.attr('width', width).attr('height', height)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([0, 2]).range([0, w])
    const y = d3.scaleLinear().domain([0, 2]).range([h, 0])

    const axisFont = { fill: '#3d4759', fontSize: '8px', fontFamily: "'JetBrains Mono', monospace" }

    // Grid
    ;[0.5, 1.0, 1.5].forEach(v => {
      g.append('line').attr('x1', x(v)).attr('y1', 0).attr('x2', x(v)).attr('y2', h).attr('stroke', '#0f1829')
      g.append('line').attr('x1', 0).attr('y1', y(v)).attr('x2', w).attr('y2', y(v)).attr('stroke', '#0f1829')
    })

    // Axes
    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(4).tickSize(0).tickPadding(5))
      .call(g => g.select('.domain').attr('stroke', '#141d2f'))
      .selectAll('text').attr('fill', axisFont.fill).attr('font-size', axisFont.fontSize).attr('font-family', axisFont.fontFamily)
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(5))
      .call(g => g.select('.domain').attr('stroke', '#141d2f'))
      .selectAll('text').attr('fill', axisFont.fill).attr('font-size', axisFont.fontSize).attr('font-family', axisFont.fontFamily)

    g.append('text').attr('x', w / 2).attr('y', h + 24).attr('text-anchor', 'middle').attr('fill', '#2d3748').attr('font-size', '9px').text('Birth')
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -h / 2).attr('y', -22).attr('text-anchor', 'middle').attr('fill', '#2d3748').attr('font-size', '9px').text('Death')

    // Diagonal
    g.append('line').attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(2)).attr('y2', y(2))
      .attr('stroke', '#141d2f').attr('stroke-dasharray', '3 2')

    // Tooltip
    const tooltip = d3.select('body').selectAll('.pd-tip').data([0]).join('div').attr('class', 'pd-tip')
      .style('position', 'absolute').style('background', '#0b1222').style('color', '#8b92a5')
      .style('padding', '6px 10px').style('border-radius', '6px').style('font-size', '10px')
      .style('font-family', "'JetBrains Mono', monospace").style('pointer-events', 'none')
      .style('opacity', 0).style('border', '1px solid #141d2f').style('z-index', '1000')
      .style('box-shadow', '0 4px 20px rgba(0,0,0,0.5)')

    const points = snapshot.persistence

    g.selectAll('circle').data(points).join('circle')
      .attr('cx', d => x(d.birth)).attr('cy', d => y(d.death))
      .attr('r', d => Math.min(2.5 + (d.death - d.birth) * 6, 8))
      .attr('fill', d => d.dim === 0 ? '#3b82f6' : '#f47252')
      .attr('opacity', 0.75)
      .on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`H${d.dim} b=${d.birth.toFixed(3)} d=${d.death.toFixed(3)} p=${(d.death - d.birth).toFixed(3)}`)
          .style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', () => tooltip.style('opacity', 0))

    // Legend
    const lg = svg.append('g').attr('transform', `translate(${width - 65},${height - 8})`)
    lg.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 3).attr('fill', '#3b82f6')
    lg.append('text').attr('x', 6).attr('y', 3).attr('fill', '#3d4759').attr('font-size', '8px').text('H0')
    lg.append('circle').attr('cx', 28).attr('cy', 0).attr('r', 3).attr('fill', '#f47252')
    lg.append('text').attr('x', 34).attr('y', 3).attr('fill', '#3d4759').attr('font-size', '8px').text('H1')
  }, [snapshot])

  if (!snapshot) {
    return (
      <div style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#2d3748', fontSize: '11px' }}>Awaiting data...</span>
      </div>
    )
  }
  return <svg ref={svgRef} />
}
