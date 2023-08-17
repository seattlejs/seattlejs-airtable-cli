import { Record, FieldSet } from "airtable";
import {
  makeSpeakerId,
  makeTalkId,
  makeEventId,
  normalizeTalkType,
  handleTalkTopics,
} from "./normalizers.js";
import { WebsiteTalk, WebsiteAirtablePair } from "./repos/website-types.js";
import { getEventSpeakers } from "./speakers.js";

export const reconcileTalks = (
  event: WebsiteAirtablePair,
  airtableSpeakers: Record<FieldSet>[],
  websiteTalks: WebsiteTalk[]
): {
  updatedTalks: WebsiteTalk[];
  removedTalks: string[];
} => {
  const newTalks = [];
  const removedTalks = [];
  const airtableEventSpeakers = getEventSpeakers(
    event.airtable,
    airtableSpeakers
  );
  for (const speaker of airtableEventSpeakers) {
    newTalks.push(makeWebsiteTalk(speaker, event.airtable));
  }
  const updatedTalks: WebsiteTalk[] = [];
  for (const newTalk of newTalks) {
    // check if talk exists in events json
    if (!event.website.talks.includes(newTalk.id)) {
      // if it doesn't add it
      event.website.talks.push(newTalk.id);
    }
    // check if talk exists in talks json
    if (!websiteTalks.find((webTalk) => webTalk.id == newTalk.id)) {
      websiteTalks.push(newTalk);
      updatedTalks.push(newTalk);
    }
  }
  // handle the case where a speaker is removed for a conflict, etc
  for (const webTalk of event.website.talks) {
    if (!newTalks.find((newTalk) => newTalk.id === webTalk)) {
      removedTalks.push(webTalk);
    }
  }
  event.website.talks = event.website.talks.filter((talkid) =>
    newTalks.find((newTalk) => newTalk.id === talkid)
  );
  return { updatedTalks, removedTalks };
};

const makeWebsiteTalk = (
  airtableSpeaker: Record<FieldSet>,
  airtableEvent: Record<FieldSet>
): WebsiteTalk => {
  const talk = {} as WebsiteTalk;
  const speakerId = makeSpeakerId(airtableSpeaker.get("Full Name") as string);
  const eventId = makeEventId(airtableEvent.get("Name") as string);
  const id = makeTalkId(speakerId, eventId);
  const talkType = normalizeTalkType(
    (airtableSpeaker.get("Talk Type") as string) || ""
  );
  talk.id = id;
  talk.speaker_id = speakerId;
  talk.event_id = eventId;
  talk.title = (airtableSpeaker.get("Talk Title") as string) || "";
  talk.abstract = (airtableSpeaker.get("Talk Blurb") as string) || "";
  talk.topics = handleTalkTopics(airtableSpeaker.get("Topics") as string);
  talk.type = talkType;
  return talk;
};

export const sortTalks = (talks) => {
  return talks.sort((a, b) => {
    if (a.event_id !== b.event_id) {
      return new Date(a.event_id) > new Date(b.event_id) ? 1 : -1;
    }
    if (a.type !== b.type) {
      return a.type === "regular" ? 1 : -1;
    }
    // preserve the order we put the talks in if
    // they are from the same event and are the same
    // type
    return 0;
  });
};
