export interface AppConfig {
  system: {
    statusCheckInterval: number
    statusCheckTimeout: number
    disableStatusCheck: boolean
    maxFavoritesDisplayed: number
  }

  storage: {
    type: "localStorage" | "json"
    path: string | null
  }
}

function getEnv(key: string, defaultValue: string): string {
  if (typeof window !== "undefined" && window.ENV && window.ENV[key]) {
    return window.ENV[key]
  }

  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key]
  }

  return defaultValue
}

function parseBoolean(value: string): boolean {
  return value.toLowerCase() === "true"
}

const defaultConfig: AppConfig = {
  system: {
    statusCheckInterval: 60,
    statusCheckTimeout: 3,
    disableStatusCheck: false,
    maxFavoritesDisplayed: 10,
  },
  storage: {
    type: "localStorage",
    path: null,
  },
}

export function loadConfig(): AppConfig {
  return {
    system: {
      statusCheckInterval: Number.parseInt(
        getEnv("STATUS_CHECK_INTERVAL", defaultConfig.system.statusCheckInterval.toString()),
        10,
      ),
      statusCheckTimeout: Number.parseInt(
        getEnv("STATUS_CHECK_TIMEOUT", defaultConfig.system.statusCheckTimeout.toString()),
        10,
      ),
      disableStatusCheck: parseBoolean(
        getEnv("DISABLE_STATUS_CHECK", defaultConfig.system.disableStatusCheck.toString()),
      ),
      maxFavoritesDisplayed: Number.parseInt(
        getEnv("MAX_FAVORITES_DISPLAYED", defaultConfig.system.maxFavoritesDisplayed.toString()),
        10,
      ),
    },
    storage: {
      type: getEnv("STORAGE_TYPE", defaultConfig.storage.type) as "localStorage" | "json",
      path: getEnv("STORAGE_PATH", "") || null,
    },
  }
}

export const config = loadConfig()
