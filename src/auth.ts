import Netrc from "netrc-parser"
// there has to be a clean way to do this
const netrc = Netrc.default

const NETRC_MACHINE_KEY = 'seattlejs-airtable-cli'

const loadApiToken = async (): Promise<string> => {
    await netrc.load()
    if (netrc.machines[NETRC_MACHINE_KEY]) {
        return netrc.machines[NETRC_MACHINE_KEY].password
    } else {
        return ''
    }
}

export const getApiToken = async (): Promise<string> => {
    return loadApiToken()
}

export const saveApiToken = async (token: string): Promise<string> => {
    // see https://github.com/coralproject/coral-cli-command/blob/dc005f97eefb51584a7f9c956ff8ea0cbdb618d4/src/auth.ts#L93
    await netrc.load()
    if (!netrc.machines[NETRC_MACHINE_KEY]) {
        netrc.machines[NETRC_MACHINE_KEY] = {}
    }
    netrc.machines[NETRC_MACHINE_KEY].login = 'no-user'
    netrc.machines[NETRC_MACHINE_KEY].password = token

    await netrc.save()
    return token
}

