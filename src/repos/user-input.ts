import prompts from "prompts";
import untildify from "untildify";
import {
  AirtablePhoto,
  WebsiteAirtableMap,
  WebsiteAirtablePair,
  WebsiteSpeaker,
  WebsiteSponsor,
  WebsiteTalk,
} from "./website-types.js";
import { validateAirtableToken } from "./airtable.js";
import { validateSeattleJsProjectPath } from "./website.js";

const MONTHS_PRIOR_LIMIT = 1;
const MONTHS_IN_FUTURE_LIMIT = 4;

const getDateMonthsAgo = (monthsPrior: number): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsPrior);
  return d;
};

const getDateMonthsInFuture = (monthsInFuture: number): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsInFuture);
  return d;
};

export const getTargetEvent = async (
  events: WebsiteAirtableMap,
): Promise<WebsiteAirtablePair> => {
  // reduce number of events to limit, taking most recent
  const someMonthsAgo = getDateMonthsAgo(MONTHS_PRIOR_LIMIT);
  const someMonthsInFuture = getDateMonthsInFuture(MONTHS_IN_FUTURE_LIMIT);
  const choices: { title: string; value: WebsiteAirtablePair }[] = [];
  for (const event in events) {
    const eventDate = new Date(String(events[event].airtable.get("Date")));
    if (eventDate > someMonthsAgo && eventDate < someMonthsInFuture) {
      choices.push({
        title: String(events[event].airtable.get("Name")),
        value: events[event],
      });
    }
  }
  // prompt user which one they want
  const choice = await prompts({
    type: "select",
    name: "eventChoice",
    message: "Which event would you like to update?",
    choices: choices,
  });
  // return selected event
  return choice.eventChoice;
};

export const confirmUpdate = async (
  updatedSpeakers: WebsiteSpeaker[],
  updatedTalks: WebsiteTalk[],
  removedTalks: string[],
  updatedSponsors: WebsiteSponsor[],
): Promise<boolean> => {
  const confirmMessage = [
    "Confirm update:\n",
    `${updatedTalks.length} new talks\n`,
    `${removedTalks.length} removed talks ${removedTalks.length ? `(${removedTalks})` : ""}\n`,
    `${updatedSponsors.length} new sponsors\n`,
    `${updatedSpeakers.length} new speakers\n`,
  ];
  const res = await prompts({
    type: "confirm",
    name: "confirmUpdate",
    message: confirmMessage.join(""),
    initial: true,
  });
  return res.confirmUpdate;
};

export const promptPhotoResize = (newPhotos: AirtablePhoto[]): void => {
  if (newPhotos.length) {
    const message = [
      "These photos need cropping and/or resizing (square, 300x300px)\n",
    ];
    for (const photo of newPhotos) {
      message.push(`      ${photo.filename}\n`);
    }
    console.log(message.join(""));
  }
};

export const promptForApiToken = async (retries = 1): Promise<string> => {
  const message = [
    "please provide an airtable Personal Access Token with scopes:\n",
    "    data.records:read\n",
    "    schema.bases:read\n",
  ];

  while (retries >= 0) {
    retries--;
    const res = await prompts({
      type: "text",
      name: "apiToken",
      message: message.join(""),
    });
    if (validateAirtableToken(res.apiToken)) {
      return res.apiToken;
    }
  }
  throw new Error("please provide a valid Airtable personal access token");
};

export const promptForSeattlejsProjectPath = async (
  retries = 1,
): Promise<string> => {
  while (retries >= 0) {
    retries--;
    const res = await prompts({
      type: "text",
      name: "projectPath",
      message: "please provide the path to your local seattlejs.com repo\n",
    });
    const expandedPath = untildify(res.projectPath);
    if (await validateSeattleJsProjectPath(expandedPath)) {
      return expandedPath;
    }
  }
  throw new Error(
    "please provide a path to a valid seattlejs.com repo or fork",
  );
};
