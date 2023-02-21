require('dotenv').config()
const yargs = require('yargs/yargs')
const fs = require('fs/promises')
const mapSpeakers = require('./src/speakers').mapSpeakers
const mapTalks = require('./src/talks').mapTalks
const getAirtableData = require('./src/airtable').getAirtableData

const argv = yargs(process.argv.slice(2))
  .boolean('s')
  .describe('s', 'output speaker images and json to add to the website')
  .alias('s', 'speakers')
  .boolean('t')
  .describe('t', 'output talks json to add to the website')
  .alias('t', 'talks')
  .argv;
(async () => {
    const airtableData = await getAirtableData()
    if (argv.speakers) {
      mapSpeakers(airtableData.speakerObjects)
    }
    if (argv.talks) {
     mapTalks(
        airtableData.eventObj,
        airtableData.speakerObjects
      )
    }
  })()

