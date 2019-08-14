import makeCountriesGraph from './countries';
import makeNetworkGraph from './network';
import makeEvolutionGraph from './evolution';
import makeProjectsGraph from './projects';
import makeOrganizationsGraph from './organizationRanking';

export default function main() {
  makeCountriesGraph().then(done => {
    document.body.classList.remove('no-overflow');
    document.getElementById('loading').classList.add('hidden');
  });
  makeNetworkGraph();
  makeEvolutionGraph();
  makeProjectsGraph();
  makeOrganizationsGraph();
}
