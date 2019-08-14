import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  select,
  drag,
  event,
  scaleOrdinal,
  scaleLinear,
  schemeCategory10
} from 'd3';

import { getParticipations } from './dataLoader';

const $graphContainer = document.getElementById('network_graph');

const $countryHighlighter = document.getElementById('country_highlight');
const $universityHighlighter = document.getElementById('university_highlight');

const margin = {
  left: 0,
  top: 20,
  bottom: 20,
  right: 0
};

const getOrganizationsPerActivity = raw => {
  const data = raw.filter(x => x.riactivityType !== 'Patent');

  const countries = data.reduce((total, current) => {
    if (total.find(x => x.country === current.countryName)) return total;
    return [...total, { country: current.countryName }];
  }, []);

  const agg = data.reduce((total, current) => {
    const foundActivity = total[current.riactivityId];
    if (foundActivity) {
      total[current.riactivityId].push(current);
      return total;
    }
    total[current.riactivityId] = [];

    total[current.riactivityId].push(current);

    return total;
  }, {});

  const listOfKeys = Object.keys(agg);

  const moreThanOneParticipantsPerActivity = listOfKeys
    .filter(act => {
      return agg[act].length > 1;
    })
    .map(act => {
      return agg[act];
    });

  const listOfParticipants = moreThanOneParticipantsPerActivity
    .flat()
    .map(x => x.affiliationName);

  // there HAS to be an easier way
  const links = moreThanOneParticipantsPerActivity.map(x => {
    return x.map((current, index, array) => {
      return array.map(c => {
        return {
          source: current.affiliationName,
          target: c.affiliationName,
          original: x
        };
      });
    });
  });

  const dataWithoutSingles = data.filter(d => {
    return listOfParticipants.find(x => x === d.affiliationName);
  });

  const nodes = dataWithoutSingles.reduce((total, current) => {
    if (total.find(x => x.id === current.affiliationName)) {
      total.find(x => x.id === current.affiliationName).value += 1;
      return total;
    }
    total.push({
      id: current.affiliationName,
      country: current.countryName,
      value: 1
    });
    return total;
  }, []);

  return {
    links: links.flat(2).filter(x => x.source !== x.target),
    nodes,
    countries
  };
};

const drawNetwork = data => {
  const width = $graphContainer.clientWidth;
  const height = 800;

  const rScale = scaleLinear()
    .range([4, 40])
    .domain([
      1,
      data.nodes.reduce((top, curr) => (top > curr.value ? top : curr.value), 0)
    ]);

  const links = data.links.map(d => Object.create(d));
  const nodes = data.nodes.map(d => Object.create(d));

  const color = () => {
    const scale = scaleOrdinal(schemeCategory10);
    return d => scale(d.country);
  };
  const dragEvent = simulation => {
    function dragstarted(d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  };

  const simulation = forceSimulation(nodes)
    .force('link', forceLink(links).id(d => d.id))
    .force('charge', forceManyBody().strength(-3))
    .force('center', forceCenter(width / 2, height / 2));

  const svg = select($graphContainer)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line');

  const node = svg
    .append('g')
    .attr('class', 'network-nodes')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', d => rScale(d.value))
    .attr('fill', color())
    .attr('id', d => `node-${d.index}`)
    .attr('data-country', d => `${d.country}`)
    .on('mouseover', d => {
      svg
        .selectAll('.network-nodes')
        .selectAll('circle')
        .style('opacity', 0.3);
      svg
        .select('.network-nodes')
        .selectAll(`#node-${d.index}`)
        .style('opacity', 1);
    })
    .on('mouseleave', () => {
      svg
        .selectAll('.network-nodes')
        .selectAll('circle')
        .style('opacity', 1);
    })
    .call(dragEvent(simulation));

  node.append('title').text(d => `${d.id} - ${d.country}`);

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node.attr('cx', d => d.x).attr('cy', d => d.y);
  });

  const legend = select($graphContainer)
    .append('svg')
    .attr('class', 'floating-legend left')
    .style('pointer-events', 'none')
    .attr('width', 150)
    .attr('height', 100)
    .append('g');

  const items = legend
    .append('g')
    .selectAll('.legend-item')
    .data(data.countries);

  items
    .enter()
    .append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('x', '0')
    .attr('y', (d, i) => {
      return i * 18;
    })
    .attr('fill', color());

  items
    .enter()
    .append('text')
    .attr('dy', '9px')
    .attr('x', 15)
    .attr('y', (d, i) => {
      return i * 18;
    })
    .attr('font-size', '10px')
    .text(d => d.country);

  $countryHighlighter.addEventListener('mouseover', () => {
    svg
      .selectAll('.network-nodes')
      .selectAll('circle')
      .style('opacity', (d, i, nodes) => {
        if (nodes[i].dataset.country === 'Serbia') return 1;
        return 0.1;
      });
  });

  $countryHighlighter.addEventListener('mouseleave', () => {
    svg
      .selectAll('.network-nodes')
      .selectAll('circle')
      .style('opacity', 1);
  });

  $universityHighlighter.addEventListener('mouseover', () => {
    svg
      .selectAll('.network-nodes')
      .selectAll('circle')
      .style('opacity', (d, i, nodes) => {
        if (nodes[i].id === 'node-6') return 1;
        return 0.1;
      });
  });

  $universityHighlighter.addEventListener('mouseleave', () => {
    svg
      .selectAll('.network-nodes')
      .selectAll('circle')
      .style('opacity', 1);
  });
};

export default function makeGraph() {
  getParticipations().then(data => {
    const organizationsPerActivity = getOrganizationsPerActivity(data);
    drawNetwork(organizationsPerActivity);
  });
}
