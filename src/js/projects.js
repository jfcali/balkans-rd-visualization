import {
  select,
  scaleLinear,
  scaleTime,
  axisLeft,
  axisBottom,
  format,
  extent,
  line,
  mouse,
  scaleOrdinal,
  selectAll
} from 'd3';

import { getProjects } from './dataLoader';

const $graphContainer = document.getElementById('activities_graph');

const width = 300;
const height = 300;

const margin = {
  left: 30,
  top: 20,
  bottom: 20,
  right: 45
};

const drawGraph = data => {
  data.forEach(project => {
    const svg = select($graphContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    const x = scaleTime()
      .domain(extent(project.values, d => d.year))
      .range([margin.left, width - margin.right]);

    const y = scaleLinear()
      .domain([
        0,
        project.values.reduce(
          (max, current) => (current.value > max ? current.value : max),
          0
        )
      ])
      .range([height - margin.bottom * 3.5, 0]);
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom * 3.5})`)
      // .attr('class', 'countries-x-axis')
      .call(axisBottom(x).tickFormat(format('.4')));
    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      // .attr('class', 'countries-y-axis')
      .call(axisLeft(y));

    const makeLine = line()
      .x(d => x(d.year))
      .y(d => y(d.value));
    svg
      .append('path')
      .data([project.values])
      .attr('class', 'line')
      .attr('d', makeLine)
      .attr('fill', 'none')
      .style('stroke', 'black')
      .style('stroke', (d, i) => {
        return 'green';
      });

    svg
      .append('text')
      .data([project])
      .attr('x', width / 2)
      .attr('y', height - margin.bottom * 2)
      .attr('dy', '.35em')
      .style('font-size', '13px')
      .style('text-anchor', 'middle')
      .text(d => {
        return d.project;
      });

    const circle = svg
      .append('circle')
      .attr('r', 5)
      .attr('opacity', 0)
      .style('pointer-events', 'none');

    const caption = svg
      .append('text')
      .attr('class', 'caption')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .attr('dy', -8);

    const curYear = svg
      .append('text')
      .attr('class', 'year')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .attr('dy', 13)
      .attr('y', height);

    function mousemove(d) {
      selectAll('.line').each((c, i, nodes) => {
        const mousePos = mouse(this);
        circle.attr('cx', mousePos[0]).attr('cy', mousePos[1]);
      });
    }
    function mouseout() {
      circle.attr('opacity', 0);
      caption.text('');
      curYear.text('');
    }
    function mouseover(d) {
      circle.attr('opacity', 1.0);
      mousemove.call(this);
    }

    svg
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseout', mouseout);
  });
};

export default function makeProjectsGraph() {
  getProjects().then(raw => {
    drawGraph(raw);
  });
}
