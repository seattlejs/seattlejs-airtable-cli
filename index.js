const yargs = require('yargs/yargs')
const mapSpeakers = require('./src/speakers').mapSpeakers

const argv = yargs(process.argv.slice(2))
  .boolean('s')
  .describe('s', 'output speaker images and json to add to the website')
  .alias('s', 'speakers').argv

if (argv.speakers) {
  mapSpeakers()
}
