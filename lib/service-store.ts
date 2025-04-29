export interface Service {
  id: string
  name: string
  description: string
  url: string
  logo: string
  category: string
  order: number
  favorite?: boolean
}

export interface Category {
  id: string
  name: string
  order: number
}

const SERVICES_STORAGE_KEY = "homelabServices"
const CATEGORIES_STORAGE_KEY = "homelabCategories"

export const defaultCategories: Category[] = [{ id: "outros", name: "Outros", order: 0 }]

export function loadServices(): Service[] {
  try {
    const savedServices = localStorage.getItem(SERVICES_STORAGE_KEY)
    return savedServices ? JSON.parse(savedServices) : []
  } catch (error) {
    console.error("Erro ao carregar serviços:", error)
    return []
  }
}

export function loadCategories(): Category[] {
  try {
    const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY)
    return savedCategories ? JSON.parse(savedCategories) : defaultCategories
  } catch (error) {
    console.error("Erro ao carregar categorias:", error)
    return defaultCategories
  }
}

export function saveServices(services: Service[]): void {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services))
  } catch (error) {
    console.error("Erro ao salvar serviços:", error)
  }
}

export function saveCategories(categories: Category[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
  } catch (error) {
    console.error("Erro ao salvar categorias:", error)
  }
}

export function addService(service: Omit<Service, "id" | "order">): Service {
  const services = loadServices()
  const categories = loadCategories()

  if (!categories.some((cat) => cat.id === service.category)) {
    throw new Error(`Categoria '${service.category}' não existe`)
  }

  const id = service.name.toLowerCase().replace(/\s+/g, "-")

  if (services.some((s) => s.id === id)) {
    throw new Error(`Já existe um serviço com o nome '${service.name}'`)
  }

  const categoryServices = services.filter((s) => s.category === service.category)
  const nextOrder = categoryServices.length > 0 ? Math.max(...categoryServices.map((s) => s.order || 0)) + 1 : 0

  const newService: Service = {
    ...service,
    id,
    order: nextOrder,
    favorite: service.favorite || false,
  }

  services.push(newService)
  saveServices(services)

  return newService
}

export function removeService(serviceId: string): Service | null {
  const services = loadServices()
  const serviceIndex = services.findIndex((s) => s.id === serviceId)

  if (serviceIndex === -1) {
    return null
  }

  const removedService = services[serviceIndex]
  services.splice(serviceIndex, 1)
  saveServices(services)

  return removedService
}

export function updateServicesOrder(updatedServices: Service[]): void {
  saveServices(updatedServices)
}

export function updateCategoriesOrder(updatedCategories: Category[]): void {
  saveCategories(updatedCategories)
}

export function toggleFavorite(serviceId: string): Service | null {
  const services = loadServices()
  const serviceIndex = services.findIndex((s) => s.id === serviceId)

  if (serviceIndex === -1) {
    return null
  }

  services[serviceIndex].favorite = !services[serviceIndex].favorite

  saveServices(services)
  return services[serviceIndex]
}

export function saveFullConfig(config: { services: Service[]; categories: Category[] }): void {
  if (!config.services || !Array.isArray(config.services)) {
    throw new Error("Configuração inválida: 'services' deve ser um array")
  }

  if (!config.categories || !Array.isArray(config.categories)) {
    throw new Error("Configuração inválida: 'categories' deve ser um array")
  }

  config.services.forEach((service, index) => {
    if (!service.id) throw new Error(`Serviço #${index + 1} não tem ID`)
    if (!service.name) throw new Error(`Serviço #${index + 1} não tem nome`)
    if (!service.url) throw new Error(`Serviço #${index + 1} não tem URL`)
    if (!service.category) throw new Error(`Serviço #${index + 1} não tem categoria`)

    if (!config.categories.some((cat) => cat.id === service.category)) {
      throw new Error(`Serviço #${index + 1} usa categoria '${service.category}' que não existe`)
    }
  })

  config.categories.forEach((category, index) => {
    if (!category.id) throw new Error(`Categoria #${index + 1} não tem ID`)
    if (!category.name) throw new Error(`Categoria #${index + 1} não tem nome`)
  })

  saveServices(config.services)
  saveCategories(config.categories)
}

export function getFullConfig(): { services: Service[]; categories: Category[] } {
  return {
    services: loadServices(),
    categories: loadCategories(),
  }
}
