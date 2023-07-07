import { strict as assert } from "node:assert";
// in June 2023, @types/lodash has an infinite loop when compiling with tsc
// see: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/63022#issuecomment-1605954005
import _ from "lodash";
import {
  targetEvent,
  airtableSpeakers,
  websiteTalks,
} from "./june-2023-sample-data.js";
import { reconcileTalks } from "../src/talks.js";

const correctTalkIds = [
  "cristina-rodriguez-june-2023",
  "aiden-bai-june-2023",
  "dm-liao-june-2023",
];

describe("reconcileTalks", function () {
  describe("should handle adding talks when none exist", function () {
    const te = _.cloneDeep(targetEvent);
    te.website.talks = [];
    const emptyWebTalks = [];
    const { updatedTalks } = reconcileTalks(
      te,
      airtableSpeakers,
      emptyWebTalks
    );
    it("should return the right talks", function () {
      const updatedTalkIds = updatedTalks.map((talk) => talk.id);
      assert(
        updatedTalkIds.every((id) => correctTalkIds.includes(id)),
        `updated talks: ${updatedTalkIds} don't match expected talks: ${correctTalkIds}`
      );
      assert(
        updatedTalks.length === 3,
        `returned ${updatedTalks.length} instead of 3`
      );
    });
    it("should update the event json", function () {
      assert(
        te.website.talks.length === 3,
        `event has ${te.website.talks.length} instead of 3`
      );
      assert(
        te.website.talks.every((id) => correctTalkIds.includes(id)),
        `correct talks: ${correctTalkIds} doesn't match event talks: ${te.website.talks}`
      );
    });
  });
  describe("should handle adding new talks to an existing event", function () {
    const te = _.cloneDeep(targetEvent);
    // remove aiden from event json
    te.website.talks = te.website.talks.filter(
      (talkId) => !talkId.includes("aiden")
    );
    // remove aiden from talks json
    const webTalks = websiteTalks.filter((talk) => !talk.id.includes("aiden"));

    const { updatedTalks } = reconcileTalks(te, airtableSpeakers, webTalks);
    const correctTalkId = "aiden-bai-june-2023";
    it("should return the right talks", function () {
      const updatedTalkIds = updatedTalks.map((talk) => talk.id);
      assert(
        updatedTalkIds[0] === correctTalkId,
        `updated talks: ${updatedTalkIds} don't match expected talks: ${correctTalkIds}`
      );
      assert(
        updatedTalks.length === 1,
        `returned ${updatedTalks.length} instead of 3`
      );
    });
    it("should update the event json", function () {
      assert(
        te.website.talks.length === 3,
        `event has ${te.website.talks.length} instead of 3`
      );
      assert(
        te.website.talks.every((id) => correctTalkIds.includes(id)),
        `correct talks: ${correctTalkIds} doesn't match event talks: ${te.website.talks}`
      );
    });
  });
  describe("should handle when talk exists but it's not on the event", function () {
    const te = _.cloneDeep(targetEvent);
    // remove dm from events json but not from talks json
    te.websiteTalks = te.website.talks.filter(
      (talkId) => !talkId.includes("dm-liao")
    );
    const { updatedTalks } = reconcileTalks(te, airtableSpeakers, websiteTalks);
    it("should return no talks to update", function () {
      assert(
        updatedTalks.length === 0,
        `${updatedTalks.length} talks were returned, expected 0`
      );
    });
    it("should update the event json", function () {
      assert(
        te.website.talks.length === 3,
        `event has ${te.website.talks.length} instead of 3`
      );
      assert(
        te.website.talks.every((id) => correctTalkIds.includes(id)),
        `correct talks: ${correctTalkIds} doesn't match event talks: ${te.website.talks}`
      );
    });
  });
  describe("should handle removing talks when speakers can't make it", function () {
    const te = _.cloneDeep(targetEvent);
    let as = _.cloneDeep(airtableSpeakers);
    // remove one of the speakers from airtable to simulate a speaker who can't make it
    as = as.filter(
      (speaker) => !speaker.get("Full Name").toLowerCase().includes("liao")
    );

    const { removedTalks } = reconcileTalks(te, as, websiteTalks);
    it("should return the correct number of removed talks", function () {
      assert(
        removedTalks.length === 1,
        `${removedTalks.length} removed talks were returned, expected 1`
      );
    });
    it("should update the event json", function () {
      assert(
        te.website.talks.length === 2,
        `event has ${te.website.talks.length} instead of 2`
      );
    });
  });
});
