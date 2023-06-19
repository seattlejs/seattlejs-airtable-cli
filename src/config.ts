import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const homePath = os.homedir()

const CONFIG_DIR = path.join(homePath,'.config')
const CONFIG_PATH = path.join(CONFIG_DIR,'seattlejs-airtable-cli.json')

export type Config = {
    seattlejsProjectPath: string
}
// this exists in src/repos/website.ts, need to refactor and make
// a place for utils
const exists = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

const ensureConfigDir = async (): Promise<void> => {
    await fs.mkdir(CONFIG_DIR, { recursive: true })
}

export const loadConfig = async (): Promise<Config> => {
    const configFileExists = await exists(CONFIG_PATH)
    const config: Config = {
        seattlejsProjectPath: '' || process.env.seattlejsProjectPath
    }
    if (configFileExists) {
        const buf = await fs.readFile(CONFIG_PATH)
        const data = JSON.parse(String(buf))
        // TODO: handle bad configs
        if (data.seattlejsProjectPath) {
            config.seattlejsProjectPath = data.seattlejsProjectPath
        }
    }
    return config
}

export const saveConfig = async (config: Config): Promise<void> => {
    await ensureConfigDir()
    const json = JSON.stringify(config, null, 4)
    await fs.writeFile(CONFIG_PATH, json)
}

