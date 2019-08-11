import { getAllData } from './dataLoader';

import makeCountriesGraph from './countries';
import makeNetworkGraph from './network';

export default function main() {
  makeCountriesGraph();
  makeNetworkGraph();
}
