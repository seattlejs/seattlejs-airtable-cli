import fs from "fs/promises";

export const getAirtableEvents = async (airtableBase, eventsId: string) => {
  const events = [];
  await airtableBase(eventsId)
    // grid view omits RSVPs, which is a very verbose field
    .select({ view: "Grid view", sort: [{ field: "Date", direction: "asc" }] })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach((r) => {
        events.push(r);
      });
      fetchNextPage();
    });
  return events;
};

export const getAirtableSpeakers = async (airtableBase, speakersId: string) => {
  const speakers = [];
  await airtableBase(speakersId)
    .select()
    .eachPage(function page(records, fetchNextPage) {
      records.forEach((r) => {
        speakers.push(r);
      });
      fetchNextPage();
    });
  return speakers;
};

export const getAirtableSponsors = async (airtableBase, sponsorsId: string) => {
  const sponsors = [];
  await airtableBase(sponsorsId)
    .select()
    .eachPage(function page(records, fetchNextPage) {
      records.forEach((r) => {
        sponsors.push(r);
      });
      fetchNextPage();
    });
  return sponsors;
};

export const validateAirtableToken = (token: string): boolean => {
    const validRegex = /^pat\w{14}\.\w{64}$/
    if (!validRegex.test(token)) {
        return false
    }
    // TODO: check metadata api calls for base scope
    // TODO: check airtable api for record:read scope
    return true
}

