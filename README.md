# seattlejs-airtable-cli
This cli app helps organizers of the SeattleJS meetup administer the seattlejs.com website.

## Getting started
### I. Make a Personal Access Token (PAT)
1. visit https://airtable.com/create/tokens
2. create new token, give it a useful name
3. give the token the following scopes (permissions):
    a. data.records:read
    b. schema.bases:read

### II. Clone the seattlejs/seattlejs.com GitHub Repo
1. `git clone https://github.com/seattlejs/seattlejs.com`
2. make a note of the path you cloned the project to, the cli will need it to update the website data.

### III. Install the cli
`npm install -g seattlejs-airtable-cli`

### IV. Run the CLI
in your shell:
`seattlejs-airtable-cli`

follow the prompts to add your api token and point the cli at the website data.

### V. Double-Check the output, commit, and push!
1. Double check that the json data looks good.
2. Crop and/or resize any new speaker photos
3. Commit any changes, push them up, and open a PR!
