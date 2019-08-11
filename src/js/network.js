import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  select,
  drag,
  event,
  scaleOrdinal,
  quantize,
  interpolateSpectral,
  schemeCategory10
} from 'd3';

import { getParticipations } from './dataLoader';

const $graphContainer = document.getElementById('network_graph');

const margin = {
  left: 30,
  top: 20,
  bottom: 20,
  right: 30
};

const getOrganizationsPerActivity = data => {
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

  const nodes = data.reduce((total, current) => {
    if (total.find(x => x.id === current.affiliationName)) return total;
    total.push({
      id: current.affiliationName,
      country: current.countryName
    });
    return total;
  }, []);

  return {
    links: links.flat(2).filter(x => x.source !== x.target),
    nodes
  };
};

const drawNetwork = data => {
  const width = 600;
  const height = 600;

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
    .force('charge', forceManyBody())
    .force('center', forceCenter(width / 2, height / 2));

  const svg = select($graphContainer)
    .append('svg')
    //.attr('viewBox', [0, 0, width, height])

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
  //.attr("stroke-width", d => Math.sqrt(d.value));

  const node = svg
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', 5)
    .attr('fill', color())
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
};

export default function makeGraph() {
  getParticipations().then(data => {
    const organizationsPerActivity = getOrganizationsPerActivity(data);
    console.log(organizationsPerActivity);
    drawNetwork(organizationsPerActivity);
  });
}
