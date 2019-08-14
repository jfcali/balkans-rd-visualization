import { getOrganizations } from './dataLoader';

const $graphContainer = document.getElementById('top_five_graph');

const $template = document.getElementById('top_five_template');

const getTopFive = (raw, amount) => {
  const organizations = Object.keys(raw);
  const organizationList = organizations
    .map(org => {
      return {
        organization: org,
        ...raw[org]
      };
    })
    .sort((a, b) => b.participations - a.participations);

  const topFive = organizationList.slice(0, amount);

  return topFive;
};

const drawGraph = topFive => {
  topFive.forEach((org, i) => {
    const node = $template.cloneNode('true');
    const $elements = Array.from(node.querySelectorAll('[data-top]'));
    $elements.forEach($element => {
      switch ($element.dataset.top) {
        case 'organization':
          $element.innerHTML = org.organization;
          break;
        case 'order':
          $element.innerHTML = i + 1;
          break;
        case 'country':
          $element.innerHTML = org.country;
          break;
        case 'participations':
          $element.innerHTML = org.participations;
      }
    });
    $graphContainer.appendChild(node);
    node.classList.remove('hidden');
  });
};

export default function makeOrganizationsGraph() {
  getOrganizations().then(raw => {
    drawGraph(getTopFive(raw, 5));
  });
}
