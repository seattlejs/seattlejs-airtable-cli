import Netrc from "netrc-parser"
// there has to be a clean way to do this
const netrc = Netrc.default

const NETRC_MACHINE_KEY = 'seattlejs.com'

const loadApiToken = async (): Promise<string> => {
    if (process.env.AIRTABLE_TOKEN) {
        return process.env.AIRTABLE_TOKEN
    }
    await netrc.load()
    if (netrc.machines[NETRC_MACHINE_KEY]) {
        return netrc.machines[NETRC_MACHINE_KEY].key
    } else {
        return ''
    }
}

export const getApiToken = async (token?: string): Promise<string> => {
    return loadApiToken()
}

    // see https://github.com/coralproject/coral-cli-command/blob/dc005f97eefb51584a7f9c956ff8ea0cbdb618d4/src/auth.ts#L93
export const saveApiToken = async (token: string): Promise<string> => {
    await netrc.load()
    if (!netrc.machines[NETRC_MACHINE_KEY]) {
        netrc.machines[NETRC_MACHINE_KEY] = {}
        netrc.machines[NETRC_MACHINE_KEY].login = 'no-user'
        netrc.machines[NETRC_MACHINE_KEY].password = token
        delete netrc.machines[NETRC_MACHINE_KEY].method
        delete netrc.machines[NETRC_MACHINE_KEY].org
    }
    await netrc.save()
    return token
}

