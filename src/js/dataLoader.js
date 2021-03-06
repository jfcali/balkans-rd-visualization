import { csv, json } from 'd3';

export const getActivities = () => csv('src/data/activities.csv');
export const getParticipations = () => csv('src/data/participations.csv');

export const getAreaDomainPerCountry = () =>
  csv('src/data/area_domain_per_country.csv');
export const getAreas = () => json('src/data/areas_without_patents.json');
export const getProjects = () => json('src/data/projects.json');
export const getOrganizations = () => json('src/data/organizationRanking.json');

export const getAllData = () =>
  new Promise((resolve, reject) =>
    Promise.all([getActivities(), getParticipations()])
      .then(res => {
        resolve({ activities: res[0], participations: res[1] });
      })
      .catch(err => reject(err))
  );
