import { getAllData } from './dataLoader';

import makeCountriesGraph from './countries';
import makeNetworkGraph from './network';
import makeEvolutionGraph from './evolution';
import makeProjectsGraph from './projects';
import makeOrganizationsGraph from './organizationRanking';

export default function main() {
  makeCountriesGraph();
  makeNetworkGraph();
  makeEvolutionGraph();
  makeProjectsGraph();
  makeOrganizationsGraph();
}
