require('dotenv').config();
const fs = require('fs/promises')
const prompts = require('prompts');
const Airtable = require('airtable');
const Jimp = require('jimp');

// this output will make directories if they don't exist
const SPEAKERS_IMAGE_DIR = './images'
// currently this output can't make directories, path must exist
const SPEAKERS_JSON_OUTPUT = './speakers.json'
const MAX_IMAGE_SIZE_BYTES = 300000

Airtable.configure({
    apiKey: process.env.AIRTABLE_TOKEN,
    endpointUrl: 'https://api.airtable.com',
});
const base = Airtable.base(process.env.BASE_ID);
const eventsId = process.env.EVENTS_TABLE_ID;
const speakersId = process.env.SPEAKERS_TABLE_ID;

(async () => {
    const events = []
    await base(eventsId)
        // grid view omits RSVPs, which is a very verbose field
        .select({view: "Grid view", sort: [{field: 'Date', direction: 'asc'}]})
        .eachPage(function page(records, fetchNextPage) {
            records.forEach(r => events.push(r))
            fetchNextPage();
        });
    // grab the last 3 events
    const nearEvents = events.slice(-3)
    const choices = await Promise.all(nearEvents.map(async e => {
        const speakerIds = e.get('Booked Speakers')
        const speakers = await Promise.all(speakerIds.map(speaker => base(speakersId).find(speaker)));
        const speakerNames = await speakers.map(speaker => speaker.get('Full Name'))
        return {
            title: e.get('Name'),
            description: `speakers: ${speakerNames}`,
            value: { eventObj: e, speakerObjects: speakers }
        }
    }));
    const choice = await prompts({
        type: 'select',
        name: 'eventChoice',
        message: 'which event would you like to update?',
        choices: choices
    });
    // make speakers
    const speakerShape = {
        id: '',
        name: '',
        company: '',
        photo: '',
        twitter: '',
    }
    const speakersOutput = []
    console.log('writing images to ' + SPEAKERS_IMAGE_DIR)
    for (let speaker of choice.eventChoice.speakerObjects) {
        const output = { ...speakerShape }
        const name = speaker.get('Full Name')
        const id = name.toLowerCase().replace(' ','-')
        output.name = name;
        output.id = id;
        output.company = speaker.get('Company');
        const rawTwitter = speaker.get('Twitter');
        if (rawTwitter[0] === '@') {
            output.twitter = rawTwitter.slice(1);
        } else { 
            output.twitter = rawTwitter
        }
        output.photo = id + '.jpg';

        const photoObj = speaker.get('Photo')[0];
        const imageUrl = photoObj.url;
        var image = await Jimp.read(imageUrl);
        // airtable represents image size in bytes
        if (photoObj.size >= MAX_IMAGE_SIZE_BYTES) {
            // default is bilinear, doesn't matter as much for downscaling
            image.resize(500,Jimp.AUTO);
        }
        await image.writeAsync(SPEAKERS_IMAGE_DIR + `/${id}.jpg`);
        speakersOutput.push(output)
    }
    const jsonOutput = JSON.stringify(speakersOutput, null, 4);
    console.log('writing speakers json to ' + SPEAKERS_JSON_OUTPUT);
    await fs.writeFile(SPEAKERS_JSON_OUTPUT, jsonOutput);
})()

