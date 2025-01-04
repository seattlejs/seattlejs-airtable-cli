const BASE_NAME = "Seattle JS Meetups";
const EVENTS_TABLE_NAME = "Events";
const SPEAKERS_TABLE_NAME = "Speakers";
const SPONSORS_TABLE_NAME = "Sponsors";
const URI_BASE = "https://api.airtable.com/v0/";

export type AirtableBase = {
  id: string;
  name: string;
  permissionLevel: string;
};

export type AirtableMetadata = {
  baseId: string;
  eventsId: string;
  speakersId: string;
  sponsorsId: string;
};

const airtableRequest = async (uri: string, token: string) => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(uri, { headers });
  const data = await res.json();
  return data;
};

/** the "metadata" api is not included in the airtable.js library,
 * need to make a client
 */
const getAirtableBases = async (token: string): Promise<AirtableBase[]> => {
  const uri = `${URI_BASE}meta/bases`;
  const data = await airtableRequest(uri, token);
  return data.bases;
};

const getAirtableTables = async (baseId: string, token: string) => {
  const uri = `${URI_BASE}meta/bases/${baseId}/tables`;
  const data = await airtableRequest(uri, token);
  return data.tables;
};

/** get seattlejs base from a list of airtable bases
 */
const getSeattleJsBaseId = async (token: string): Promise<string> => {
  const airtableBases = await getAirtableBases(token);
  for (const base of airtableBases) {
    if (base.name === BASE_NAME) {
      return base.id;
    }
  }
  throw new Error("unable to find airtable base id, try entering it manually");
};

export const getAirtableMetadata = async (
  token: string,
): Promise<AirtableMetadata> => {
  const baseId = await getSeattleJsBaseId(token);
  const tables = await getAirtableTables(baseId, token);
  const eventsTable = tables.find((table) => table.name === EVENTS_TABLE_NAME);
  const speakersTable = tables.find(
    (table) => table.name === SPEAKERS_TABLE_NAME,
  );
  const sponsorsTable = tables.find(
    (table) => table.name === SPONSORS_TABLE_NAME,
  );
  const ids: AirtableMetadata = {
    baseId: baseId,
    eventsId: eventsTable.id,
    speakersId: speakersTable.id,
    sponsorsId: sponsorsTable.id,
  };
  return ids;
};
