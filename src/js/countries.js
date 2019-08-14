import {
  select,
  axisLeft,
  axisBottom,
  scaleLinear,
  scaleBand,
  scaleOrdinal,
  stack,
  stackOffsetExpand,
  quantize,
  interpolateSpectral,
  format,
  stackOrderAscending
} from 'd3';

import { getAllData } from './dataLoader';

const $graphContainer = document.getElementById('countries_graph');
const $buttons = document.querySelectorAll('[data-countries]');

const width = 600;
const height = 600;

const margin = {
  left: 30,
  top: 20,
  bottom: 20,
  right: 30
};

const getDomainsPerCountry = countryInfo => {
  const countryList = Object.keys(countryInfo);

  const domainCountPerCountry = countryList.map(country => {
    const currentCountryActivities = countryInfo[country];

    const domains = currentCountryActivities
      .map(activity => activity.activityInfo.map(x => x.domainName))
      .flat()
      .reduce((total, current) => {
        if (total[current]) {
          total[current] += 1;
          return total;
        }
        total[current] = 1;
        return total;
      }, {});

    return { country, ...domains };
  });
  return domainCountPerCountry;
};

const drawGraph = (data, maxCount) => {
  const svg = select($graphContainer)
    .append('svg')
    //.attr('viewBox', [0, 0, width, height])

    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = scaleLinear()
    .domain([0, 1])
    .rangeRound([margin.left, width - margin.right]);

  const y = scaleBand()
    .domain(data.map(d => d.country))
    .range([margin.top, height - margin.bottom * 2])
    .padding(0.1);

  const series = stack()
    .keys(Object.keys(data[0]).filter(x => x !== 'country'))
    .offset(stackOffsetExpand)
    .order(stackOrderAscending)(data);

  const unnormalSeries = stack().keys(
    Object.keys(data[0]).filter(x => x !== 'country')
  )(data);

  const colors = scaleOrdinal()
    .domain(series.map(d => d.key))
    .range(
      quantize(t => interpolateSpectral(t * 0.8 + 0.1), series.length).reverse()
    )
    .unknown('#ccc');

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom * 2})`)
    .attr('class', 'countries-x-axis')
    .call(axisBottom(x).tickFormat(format('.0%')));
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .attr('class', 'countries-y-axis')
    .call(axisLeft(y));

  renderNormalized(svg, series, x, y, colors);

  const legend = select($graphContainer)
    .append('svg')
    .attr('class', 'floating-legend')
    .attr('width', '200')
    .attr('height', '400');

  const items = legend
    .append('g')
    .selectAll('.legend-item')
    .data(series);

  items
    .enter()
    .append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('x', '0')
    .attr('y', (d, i) => {
      return i * 18;
    })
    .attr('fill', d => colors(d.key));

  items
    .enter()
    .append('text')
    .attr('dy', '9px')
    .attr('x', 15)
    .attr('y', (d, i) => {
      return i * 18;
    })
    .attr('font-size', '10px')
    .text(d => d.key);
  $buttons.forEach(button =>
    button.addEventListener('change', e => {
      if (e.target.dataset.countries === 'normalized') {
        renderNormalized(svg, series, x, y, colors);
      } else {
        render(svg, unnormalSeries, x, y, colors, maxCount);
      }
    })
  );
};

const renderNormalized = (svg, series, x, y, colors) => {
  x.domain([0, 1]);
  const group = svg.selectAll('.stack').data(series);

  group.exit().remove();

  group
    .enter()
    .append('g')
    .attr('class', 'stack')
    .attr('fill', d => colors(d.key));

  const bars = svg
    .selectAll('.stack')
    .selectAll('rect')
    .data(d => d);
  bars.exit().remove();

  bars
    .enter()
    .append('rect')
    .merge(bars)
    .transition()
    .attr('width', d => x(d[1]) - x(d[0]))
    .attr('x', d => {
      return x(d[0]);
    })
    .attr('y', (d, i) => y(d.data.country))
    .attr('height', y.bandwidth());

  select('.countries-x-axis').call(axisBottom(x).tickFormat(format('.0%')));
};

const render = (svg, series, x, y, colors, maxCount) => {
  x.domain([0, maxCount]);
  const group = svg.selectAll('.stack').data(series);

  group
    .enter()
    .selectAll('.stack')
    .append('title')
    .text(d => {
      return 's';
    });

  group.exit().remove();

  group
    .enter()
    .append('g')
    .attr('class', 'stack')
    .attr('fill', d => colors(d.key));

  const bars = svg
    .selectAll('.stack')
    .selectAll('rect')
    .data(d => d);
  bars.exit().remove();

  bars
    .enter()
    .append('rect')
    .merge(bars)
    .transition()
    .attr('width', d => x(d[1]) - x(d[0]))
    .attr('x', d => {
      return x(d[0]);
    })
    .attr('y', (d, i) => y(d.data.country))
    .attr('height', y.bandwidth());

  select('.countries-x-axis').call(axisBottom(x).tickFormat(format('.2s')));
};

export default function makeGraph() {
  getAllData().then(data => {
    // console.log(data);
    const infoPerCountry = data.participations.reduce((total, current) => {
      const foundCountry = total[current.countryName];
      const activityInfo = data.activities.filter(
        x => x.riactivityId === current.riactivityId
      );
      if (foundCountry) {
        total[current.countryName].push({ ...current, activityInfo });
        return total;
      }
      total[current.countryName] = [];
      total[current.countryName].push({ ...current, activityInfo });

      return total;
    }, {});
    const parsedData = getDomainsPerCountry(infoPerCountry);
    // console.log(infoPerCountry);

    const maxCount = Object.keys(infoPerCountry)
      .map(country => {
        return infoPerCountry[country].length;
      })
      .reduce((max, current) => (current > max ? current : max));

    drawGraph(parsedData, maxCount);
  });
}
