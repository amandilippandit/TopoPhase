import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function PersistenceDiagram({ snapshot }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!snapshot || !snapshot.persistence) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 250, height = 250
    const margin = { top: 4, right: 12, bottom: 34, left: 34 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom

    svg.attr('width', width).attr('height', height)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([0, 2]).range([0, w])
    const y = d3.scaleLinear().domain([0, 2]).range([h, 0])

    // Grid
    ;[0.5, 1.0, 1.5].forEach(v => {
      g.append('line').attr('x1', x(v)).attr('y1', 0).attr('x2', x(v)).attr('y2', h).attr('stroke', '#18181b')
      g.append('line').attr('x1', 0).attr('y1', y(v)).attr('x2', w).attr('y2', y(v)).attr('stroke', '#18181b')
    })

    const axisFont = { fill: '#52525b', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }
    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(4).tickSize(0).tickPadding(6))
      .call(g => g.select('.domain').attr('stroke', '#27272a'))
      .selectAll('text').attr('fill', axisFont.fill).attr('font-size', axisFont.fontSize).attr('font-family', axisFont.fontFamily)
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(6))
      .call(g => g.select('.domain').attr('stroke', '#27272a'))
      .selectAll('text').attr('fill', axisFont.fill).attr('font-size', axisFont.fontSize).attr('font-family', axisFont.fontFamily)

    g.append('text').attr('x', w / 2).attr('y', h + 26).attr('text-anchor', 'middle').attr('fill', '#52525b').attr('font-size', '11px').text('Birth')
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -h / 2).attr('y', -24).attr('text-anchor', 'middle').attr('fill', '#52525b').attr('font-size', '11px').text('Death')

    // Diagonal
    g.append('line').attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(2)).attr('y2', y(2))
      .attr('stroke', '#27272a').attr('stroke-dasharray', '4 3')

    // Tooltip
    const tooltip = d3.select('body').selectAll('.pd-tip').data([0]).join('div').attr('class', 'pd-tip')
      .style('position', 'absolute').style('background', '#09090b').style('color', '#a1a1aa')
      .style('padding', '8px 12px').style('border-radius', '6px').style('font-size', '11px')
      .style('font-family', "'JetBrains Mono', monospace").style('pointer-events', 'none')
      .style('opacity', 0).style('border', '1px solid #27272a').style('z-index', '1000')
      .style('box-shadow', '0 4px 24px rgba(0,0,0,0.6)')

    const points = snapshot.persistence
    g.selectAll('circle').data(points).join('circle')
      .attr('cx', d => x(d.birth)).attr('cy', d => y(d.death))
      .attr('r', d => Math.min(3 + (d.death - d.birth) * 7, 9))
      .attr('fill', d => d.dim === 0 ? '#fafafa' : '#a1a1aa')
      .attr('opacity', d => d.dim === 0 ? 0.8 : 0.5)
      .attr('stroke', d => d.dim === 0 ? '#fafafa' : '#71717a')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`H${d.dim}  birth=${d.birth.toFixed(3)}  death=${d.death.toFixed(3)}  persistence=${(d.death - d.birth).toFixed(3)}`)
          .style('left', (event.pageX + 12) + 'px').style('top', (event.pageY - 12) + 'px')
      })
      .on('mouseout', () => tooltip.style('opacity', 0))

    // Legend
    const lg = svg.append('g').attr('transform', `translate(${width - 72},${height - 10})`)
    lg.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 3).attr('fill', '#fafafa')
    lg.append('text').attr('x', 7).attr('y', 3).attr('fill', '#71717a').attr('font-size', '10px').text('H0')
    lg.append('circle').attr('cx', 34).attr('cy', 0).attr('r', 3).attr('fill', '#a1a1aa').attr('opacity', 0.5)
    lg.append('text').attr('x', 41).attr('y', 3).attr('fill', '#71717a').attr('font-size', '10px').text('H1')
  }, [snapshot])

  if (!snapshot) {
    return (
      <div style={{ width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--fg-faint)', fontSize: '13px' }}>Awaiting data...</span>
      </div>
    )
  }
  return <svg ref={svgRef} />
}
