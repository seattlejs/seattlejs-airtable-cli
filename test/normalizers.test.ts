import { strict as assert } from "node:assert";
import { airtableSpeakers } from "./june-2023-sample-data.js";
import { handleTalkTopics } from "../src/normalizers.js";

describe("getTalkTopics", function () {
  describe("should handle when topics exist", function () {
    const topics = handleTalkTopics(
      airtableSpeakers[0].get("Topics") as string
    );
    const expectedTopics = (airtableSpeakers[0].get("Topics") as string).split(
      ", "
    );
    assert(
      topics === expectedTopics,
      `topics ${topics} did not match ${expectedTopics}`
    );
  });
  describe("should handle when topics don't exist", function () {
    const undefinedTopics = handleTalkTopics(undefined);
    const emptyStringTopics = handleTalkTopics("");
    assert(
      Array.isArray(undefinedTopics) && undefinedTopics.length === 0,
      "should handle undefined"
    );
    assert(
      Array.isArray(emptyStringTopics) && emptyStringTopics.length === 0,
      "should handle empty string"
    );
  });
});
