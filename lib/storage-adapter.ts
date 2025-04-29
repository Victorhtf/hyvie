import type { Service, Category } from "@/lib/service-store"
import { config } from "@/lib/config"

export interface StorageAdapter {
  loadServices(): Promise<Service[]>
  loadCategories(): Promise<Category[]>
  saveServices(services: Service[]): Promise<void>
  saveCategories(categories: Category[]): Promise<void>
}

class LocalStorageAdapter implements StorageAdapter {
  private SERVICES_KEY = "hyvieServices"
  private CATEGORIES_KEY = "hyvieCategories"

  async loadServices(): Promise<Service[]> {
    if (typeof window === "undefined") return []

    try {
      const data = localStorage.getItem(this.SERVICES_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Erro ao carregar serviços do localStorage:", error)
      return []
    }
  }

  async loadCategories(): Promise<Category[]> {
    if (typeof window === "undefined") return []

    try {
      const data = localStorage.getItem(this.CATEGORIES_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Erro ao carregar categorias do localStorage:", error)
      return []
    }
  }

  async saveServices(services: Service[]): Promise<void> {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.SERVICES_KEY, JSON.stringify(services))
    } catch (error) {
      console.error("Erro ao salvar serviços no localStorage:", error)
      throw error
    }
  }

  async saveCategories(categories: Category[]): Promise<void> {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories))
    } catch (error) {
      console.error("Erro ao salvar categorias no localStorage:", error)
      throw error
    }
  }
}

class JsonFileAdapter implements StorageAdapter {
  private fs: any
  private path: string

  constructor(path: string) {
    this.path = path
    if (typeof window === "undefined") {
      this.fs = require("fs/promises")
    }
  }

  private async readFile<T>(defaultValue: T): Promise<T> {
    try {
      const data = await this.fs.readFile(this.path, "utf8")
      const parsed = JSON.parse(data)
      return parsed
    } catch (error) {
      console.error(`Erro ao ler arquivo ${this.path}:`, error)
      return defaultValue
    }
  }

  private async writeFile(data: any): Promise<void> {
    try {
      const dir = require("path").dirname(this.path)
      await this.fs.mkdir(dir, { recursive: true })
      await this.fs.writeFile(this.path, JSON.stringify(data, null, 2), "utf8")
    } catch (error) {
      console.error(`Erro ao escrever arquivo ${this.path}:`, error)
      throw error
    }
  }

  async loadServices(): Promise<Service[]> {
    const data = await this.readFile<{ services: Service[]; categories: Category[] }>({ services: [], categories: [] })
    return data.services || []
  }

  async loadCategories(): Promise<Category[]> {
    const data = await this.readFile<{ services: Service[]; categories: Category[] }>({ services: [], categories: [] })
    return data.categories || []
  }

  async saveServices(services: Service[]): Promise<void> {
    const data = await this.readFile<{ services: Service[]; categories: Category[] }>({ services: [], categories: [] })
    data.services = services
    await this.writeFile(data)
  }

  async saveCategories(categories: Category[]): Promise<void> {
    const data = await this.readFile<{ services: Service[]; categories: Category[] }>({ services: [], categories: [] })
    data.categories = categories
    await this.writeFile(data)
  }
}

export function createStorageAdapter(): StorageAdapter {
  switch (config.storage.type) {
    case "json":
      if (!config.storage.path) {
        throw new Error("STORAGE_PATH deve ser definido quando STORAGE_TYPE=json")
      }
      return new JsonFileAdapter(config.storage.path)

    case "localStorage":
    default:
      return new LocalStorageAdapter()
  }
}

export const storageAdapter = createStorageAdapter()
