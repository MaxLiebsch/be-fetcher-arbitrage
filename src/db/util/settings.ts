import { getSettingsCol } from "../mongo.js";


export async function getAllowedDomains() {
  const settings = await getSettingsCol();
  const allowedDomains = await settings.findOne({name: 'allowed-domains'});
  if(!allowedDomains) {
    throw new Error('Allowed domains not found');
  }
  return allowedDomains.domains as string[];
}


