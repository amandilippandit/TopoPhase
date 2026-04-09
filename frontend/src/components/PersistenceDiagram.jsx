import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function PersistenceDiagram({ snapshot }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!snapshot || !snapshot.persistence) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 280, height = 280
    const margin = { top: 28, right: 20, bottom: 40, left: 40 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom

    svg.attr('width', width).attr('height', height)

    svg.append('text')
      .attr('x', width / 2).attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af').attr('font-size', '13px')
      .text('Persistence diagram')

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([0, 2]).range([0, w])
    const y = d3.scaleLinear().domain([0, 2]).range([h, 0])

    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(4)).selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px')
    g.selectAll('.domain, .tick line').attr('stroke', '#4b5563')

    g.append('g')
      .call(d3.axisLeft(y).ticks(4)).selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px')
    g.selectAll('.domain, .tick line').attr('stroke', '#4b5563')

    g.append('text').attr('x', w / 2).attr('y', h + 32)
      .attr('text-anchor', 'middle').attr('fill', '#6b7280').attr('font-size', '11px')
      .text('Birth')
    g.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -h / 2).attr('y', -30)
      .attr('text-anchor', 'middle').attr('fill', '#6b7280').attr('font-size', '11px')
      .text('Death')

    g.append('line')
      .attr('x1', x(0)).attr('y1', y(0))
      .attr('x2', x(2)).attr('y2', y(2))
      .attr('stroke', '#4b5563').attr('stroke-dasharray', '4 2')

    g.append('line')
      .attr('x1', x(0)).attr('y1', y(2))
      .attr('x2', x(2)).attr('y2', y(2))
      .attr('stroke', '#6b7280').attr('stroke-dasharray', '3 3')

    const tooltip = d3.select('body').selectAll('.pd-tooltip').data([0])
      .join('div').attr('class', 'pd-tooltip')
      .style('position', 'absolute').style('background', '#1f2937')
      .style('color', '#e0e0e0').style('padding', '6px 10px')
      .style('border-radius', '4px').style('font-size', '11px')
      .style('pointer-events', 'none').style('opacity', 0)
      .style('border', '1px solid #374151')

    const points = snapshot.persistence
    const dimColor = (dim) => dim === 0 ? '#378ADD' : '#D85A30'

    g.selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => x(d.birth))
      .attr('cy', d => y(d.death))
      .attr('r', d => Math.min(4 + (d.death - d.birth) * 10, 12))
      .attr('fill', d => dimColor(d.dim))
      .attr('opacity', 0.75)
      .on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`dim=${d.dim}, birth=${d.birth.toFixed(3)}, death=${d.death.toFixed(3)}, persistence=${(d.death - d.birth).toFixed(3)}`)
          .style('left', (event.pageX + 12) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', () => tooltip.style('opacity', 0))

    const legend = svg.append('g').attr('transform', `translate(${margin.left + 4}, ${height - 10})`)
    legend.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 4).attr('fill', '#378ADD')
    legend.append('text').attr('x', 8).attr('y', 4).attr('fill', '#9ca3af').attr('font-size', '10px').text('H0')
    legend.append('circle').attr('cx', 40).attr('cy', 0).attr('r', 4).attr('fill', '#D85A30')
    legend.append('text').attr('x', 48).attr('y', 4).attr('fill', '#9ca3af').attr('font-size', '10px').text('H1')
  }, [snapshot])

  return <svg ref={svgRef} />
}
