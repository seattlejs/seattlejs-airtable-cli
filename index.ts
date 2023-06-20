#! /usr/bin/env node
import Airtable from "airtable";
import {
  getAirtableEvents,
  getAirtableSpeakers,
  getAirtableSponsors,
} from "./src/repos/airtable.js";
import {
  getWebsiteEvents,
  getWebsiteSpeakers,
  getWebsiteSponsors,
  getWebsiteTalks,
} from "./src/repos/website.js";
import {
  confirmUpdate,
  getTargetEvent,
  promptForApiToken,
  promptForSeattlejsProjectPath,
  promptPhotoResize,
} from "./src/repos/user-input.js";
import {
  mapAirtableEventsToWebsiteEvents,
  makeWebsiteEvent,
  reconcileEvents,
} from "./src/events.js";
import { reconcileSpeakers } from "./src/speakers.js";
import { reconcileSponsors } from "./src/sponsors.js";
import { reconcileTalks } from "./src/talks.js";
import { exportImages, exportData } from "./src/repos/website.js";
import {
  AirtableMetadata,
  getAirtableMetadata,
} from "./src/repos/airtable-metadata.js";
import { getApiToken, saveApiToken } from "./src/auth.js";
import { loadConfig, saveConfig } from "./src/config.js";

console.log('welcome to the seattlejs-airtable-cli!')
let token = await getApiToken()
if (!token) {
    token = await promptForApiToken()
    await saveApiToken(token)
}

let config = await loadConfig()
if (!config.seattlejsProjectPath) {
    const projectPath = await promptForSeattlejsProjectPath()
    config.seattlejsProjectPath = projectPath
    await saveConfig(config)
}

const airtableMetadata: AirtableMetadata = await getAirtableMetadata(token);

Airtable.configure({
  apiKey: token,
  endpointUrl: "https://api.airtable.com",
});
console.log("querying airtable...")
const airtableBase = Airtable.base(airtableMetadata.baseId);

// load the airtable data we'll need
const airtableEvents = await getAirtableEvents(
  airtableBase,
  airtableMetadata.eventsId
);
const airtableSpeakers = await getAirtableSpeakers(
  airtableBase,
  airtableMetadata.speakersId
);
const airtableSponsors = await getAirtableSponsors(
  airtableBase,
  airtableMetadata.sponsorsId
);

console.log("gathering existing website data...")
const websiteEvents = await getWebsiteEvents(config.seattlejsProjectPath);
const websiteSpeakers = await getWebsiteSpeakers(config.seattlejsProjectPath);
const websiteTalks = await getWebsiteTalks(config.seattlejsProjectPath);
const websiteSponsors = await getWebsiteSponsors(config.seattlejsProjectPath);

// associate all the airtable events with the website events
// this is kind of bad because it will miss events that are in
// the website but not in airtable. It's not all that bad because
// the eventmap isn't used for writing the actual json output, it's
// only used to prompt the user for which event they want to modify
const eventMap = mapAirtableEventsToWebsiteEvents(
  airtableEvents,
  websiteEvents
);

let targetEvent = await getTargetEvent(eventMap);
if (!targetEvent.website) {
  targetEvent.website = makeWebsiteEvent(targetEvent.airtable);
}

const { newPhotos, updatedSpeakers } = reconcileSpeakers(
  targetEvent,
  airtableSpeakers,
  websiteSpeakers
);

const updatedTalks = reconcileTalks(
  targetEvent,
  airtableSpeakers,
  websiteTalks
);

const { newLogos, updatedSponsors } = reconcileSponsors(
  targetEvent,
  airtableSponsors,
  websiteSponsors
);

reconcileEvents(targetEvent, websiteEvents);

const confirmation = await confirmUpdate(
  updatedSpeakers,
  updatedTalks,
  updatedSponsors
);
if (confirmation) {
  await exportData(websiteSpeakers, "speakers", config.seattlejsProjectPath);
  const existingPhotos = await exportImages(newPhotos, "speakers", config.seattlejsProjectPath);
  await exportData(websiteTalks, "talks", config.seattlejsProjectPath);

  await exportData(websiteSponsors, "sponsors", config.seattlejsProjectPath);
  await exportImages(newLogos, "sponsors", config.seattlejsProjectPath);

  await exportData(websiteEvents, "events", config.seattlejsProjectPath);

  promptPhotoResize(existingPhotos);
} else {
  console.log("aborting update, have a nice day :)");
}
