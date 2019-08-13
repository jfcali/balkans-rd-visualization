import {
  select,
  scaleOrdinal,
  scaleLinear,
  quantize,
  interpolateSpectral,
  extent,
  axisBottom,
  axisLeft,
  scaleTime,
  format,
  stack,
  area,
  max
} from 'd3';
import { getAreas } from './dataLoader';

const $graphContainer = document.getElementById('areas_graph');
const $resetGraph = document.getElementById('resetAreas');
const $highlights = Array.from(
  document.querySelectorAll('[data-evohighlight]')
);

const width = 600;
const height = 600;

const margin = {
  left: 30,
  top: 20,
  bottom: 20,
  right: 30
};

const parseData = data => {
  const years = Object.keys(data);

  const parsedData = years.map(year => {
    return {
      year: +year,
      ...data[year]
    };
  });
  const areas = Array.from(
    new Set([
      ...parsedData.reduce((total, current) => {
        const currentKeys = Object.keys(current).filter(x => x !== 'year');
        return [...total, ...currentKeys];
      }, [])
    ])
  );

  const allData = years.map(y => {
    const currentYear = data[y];

    const missing = areas
      .map(a => {
        return {
          area: a,
          value: currentYear[a] ? currentYear[a] : 0
        };
      })
      .reduce((total, current) => {
        total[current.area] = current.value;
        return total;
      }, {});

    return {
      year: +y,
      ...missing
    };
  });

  const allFlatData = years.map(y => {
    const missing = areas
      .map(a => {
        return {
          area: a,
          value: 0
        };
      })
      .reduce((total, current) => {
        total[current.area] = current.value;
        return total;
      }, {});

    return {
      year: +y,
      ...missing
    };
  });

  const areaData = areas.map(a => {
    const d = parsedData.map(x => {
      return {
        value: x[a] ? x[a] : 0,
        year: x.year
      };
    });
    return {
      name: a,
      values: d
    };
  });

  return {
    areas,
    areaData,
    allData,
    allFlatData
  };
};

const drawAreas = ({ svg, series, y, makeArea }) => {
  y.domain([0, max(series, d => max(d, d => d[1]))]);

  svg.select('.line').attr('style', 'opacity:0');
  svg.select('.evolution-y-axis').call(axisLeft(y));
  svg
    .select('.evolution-areas')
    .selectAll('path')
    .data(series)
    .join('path')
    .transition()
    .attr('d', d => makeArea(d));
};

const drawSingleLine = ({
  svg,
  lineData,
  colors,
  y,
  x,
  key,
  flatSeries,
  makeArea
}) => {
  svg
    .select('.evolution-areas')
    .selectAll('path')
    .data(flatSeries)
    .join('path')
    .transition()
    .attr('d', d => makeArea(d));

  y.domain([
    0,
    lineData.reduce((maxV, curr) => (maxV > curr.value ? maxV : curr.value), 0)
  ]);

  const makeLine = area()
    .x(d => x(d.year))
    .y0(y(0))
    .y1(d => y(d.value));

  svg
    .select('.evolution-y-axis') // change the y axis
    .call(axisLeft(y));
  svg
    .select('.line')
    .attr('style', 'opacity:1')
    .transition()
    // .attr('fill', 'none')
    .attr('fill', () => {
      return colors(key);
    })
    .attr('d', makeLine(lineData));
};

const highlight = key => {
  const svg = select($graphContainer);

  svg
    .select('.evolution-areas')
    .selectAll('path')
    .style('opacity', '0.3');

  svg
    .selectAll(
      `#evolution-${key
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/,/g, '-')}`
    )
    .style('opacity', 1);
};

const unhighlight = () => {
  const svg = select($graphContainer);
  svg
    .select('.evolution-areas')
    .selectAll('path')
    .style('opacity', '1');
};

$highlights.forEach(h => {
  h.addEventListener('mouseover', () => highlight(h.dataset.evohighlight));
  h.addEventListener('mouseleave', () => unhighlight());
});

const drawGraph = data => {
  const svg = select($graphContainer)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const { areas, areaData, allData, allFlatData } = parseData(data);

  const series = stack().keys(areas)(allData);

  const flatSeries = stack().keys(areas)(allFlatData);

  const x = scaleTime()
    .domain(extent(areaData[0].values, d => d.year))
    .range([margin.left, width - margin.right]);

  const y = scaleLinear()
    .domain([0, max(series, d => max(d, d => d[1]))])
    .range([height - margin.bottom * 2, 0]);

  const makeArea = area()
    .x(d => x(d.data.year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  const colors = scaleOrdinal()
    .domain(areas.map(d => d))
    .range(
      quantize(t => interpolateSpectral(t * 0.8 + 0.1), areas.length).reverse()
    )
    .unknown('#ccc');

  svg.append('path').attr('class', 'line');

  svg
    .append('g')
    .attr('class', 'evolution-areas')
    .selectAll('path')
    .data(series)
    .join('path')
    .attr(
      'id',
      (d, i) =>
        `evolution-${d.key
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/,/g, '-')}`
    )
    .attr('fill', d => colors(d.key))
    .attr('d', d => {
      return makeArea(d);
    })
    .on('click', d => {
      $resetGraph.classList.remove('hidden');
      const lineData = areaData.find(a => a.name === d.key).values;
      drawSingleLine({
        svg,
        lineData,
        colors,
        y,
        x,
        flatSeries,
        key: d.key,
        makeArea
      });
    })
    .on('mouseenter', d => highlight(d.key))
    .on('mouseleave', () => unhighlight())
    .append('title')
    .text(({ key }) => key);

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom * 2})`)
    .attr('class', 'evolution-x-axis')
    .call(axisBottom(x).tickFormat(format('.4')));
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .attr('class', 'evolution-y-axis')
    .call(axisLeft(y));

  $resetGraph.addEventListener('click', () => {
    drawAreas({
      svg,
      series,
      y,
      makeArea
    });
    $resetGraph.classList.add('hidden');
  });

  const lines = svg.append('g').attr('class', 'lines');

  // lines
  //   .selectAll('.line-group')
  //   .data(areaData)
  //   .enter()
  //   .append('g')
  //   .attr('class', 'line-group')
  //   .append('path')
  //   .attr('class', 'line')
  //   .attr('d', d => makeLine(d.values))
  //   .attr('fill', 'none')
  //   .style('stroke', 'black')
  //   .style('stroke', (d, i) => {
  //     return colors(d.name);
  //   });
  // //.style('opacity', lineOpacity);

  // const smallWidth = 200;
  // const smallHeight = 200;

  // areaData.forEach((area, index) => {
  //   console.log(area);

  //   const svg = select('#areas_graph2')
  //     .append('svg')
  //     .attr('width', smallWidth)
  //     .attr('height', smallHeight)
  //     .append('g');
  //   // .attr('transform', `translate(${margin.left},${margin.top})`);

  //   const x = scaleTime()
  //     .domain(extent(area.values, d => d.year))
  //     .range([20, smallWidth]);

  //   const y = scaleLinear()
  //     .domain([
  //       0,
  //       area.values.reduce(
  //         (max, current) => (current.value > max ? current.value : max),
  //         0
  //       )
  //     ])
  //     .range([smallHeight - 20, 0]);

  //   const makeLine = line()
  //     .x(d => x(d.year))
  //     .y(d => y(d.value));
  //   // Add the valueline path.
  //   svg
  //     .append('path')
  //     .data([area.values])
  //     .attr('class', 'line')
  //     .attr('d', makeLine)
  //     .attr('fill', 'none')
  //     .style('stroke', 'black')
  //     .style('stroke', (d, i) => {
  //       console.log(d);
  //       return colors(d.name);
  //     });

  //   svg
  //     .append('g')
  //     .attr('transform', `translate(0,${smallHeight - 20})`)
  //     // .attr('class', 'countries-x-axis')
  //     .call(axisBottom(x).tickFormat(format('.4')));
  //   svg
  //     .append('g')
  //     .attr('transform', `translate(${20},0)`)
  //     // .attr('class', 'countries-y-axis')
  //     .call(axisLeft(y));
  //   // lines
  //   //   .selectAll('.line-g')
  //   //   .datum(area.values)
  //   //   .append('g')
  //   //   .attr('class', 'line-g')
  //   //   .append('path')
  //   //   .attr('d', d => {
  //   //     console.log(d);
  //   //     return makeLine(d.values);
  //   //   })
  //   //   .attr('fill', 'none')
  //   //   .style('stroke', 'black')
  //   //   .style('stroke', (d, i) => {
  //   //     console.log(d);
  //   //     return colors(d.name);
  //   //   });
  // });
};

export default function makeEvolutionGraph() {
  getAreas().then(data => {
    drawGraph(data);
  });
}
