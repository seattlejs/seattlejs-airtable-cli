exports.getAirtableData = async () => {
  const Airtable = require('airtable')
  const prompts = require('prompts')

  Airtable.configure({
    apiKey: process.env.AIRTABLE_TOKEN,
    endpointUrl: 'https://api.airtable.com'
  })
  const base = Airtable.base(process.env.BASE_ID)
  const eventsId = process.env.EVENTS_TABLE_ID
  const speakersId = process.env.SPEAKERS_TABLE_ID

  const events = []
  await base(eventsId)
    // grid view omits RSVPs, which is a very verbose field
    .select({ view: 'Grid view', sort: [{ field: 'Date', direction: 'asc' }] })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(r => {
        events.push(r)
        fetchNextPage()
      })
    })
  // grab the last 3 events
  const nearEvents = events.slice(-3)
  const choices = await Promise.all(
    nearEvents.map(async e => {
      const speakerIds = e.get('Booked Speakers')
      const speakers = await Promise.all(
        speakerIds.map(speaker => base(speakersId).find(speaker))
      )
      const speakerNames = await speakers.map(speaker =>
        speaker.get('Full Name')
      )
      return {
        title: e.get('Name'),
        description: `speakers: ${speakerNames}`,
        value: { eventObj: e, speakerObjects: speakers }
      }
    })
  )
  const choice = await prompts({
    type: 'select',
    name: 'eventChoice',
    message: 'which event would you like to update?',
    choices: choices
  })
  return choice.eventChoice
}
