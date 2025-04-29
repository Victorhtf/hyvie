"use client"

import { useState, useEffect, useRef, createContext, useContext } from "react"
import Link from "next/link"
import { CheckCircle, ChevronUp, Filter, GripVertical, Save, XCircle, X, Edit, Star } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToParentElement } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  loadServices,
  loadCategories,
  updateServicesOrder,
  updateCategoriesOrder,
  toggleFavorite,
  type Service,
  type Category,
} from "@/lib/service-store"

const ServiceStatusContext = createContext({})

async function checkServiceStatus(url: string): Promise<boolean> {
  try {
    const timestamp = new Date().getTime()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${url}?_=${timestamp}`, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return true
  } catch (error) {
    console.error(`Erro ao verificar status de ${url}:`, error)

    try {
      return await checkWithImage(url)
    } catch {
      return false
    }
  }
}

async function checkWithImage(baseUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const timestamp = new Date().getTime()

    const timeout = setTimeout(() => {
      img.src = ""
      resolve(false)
    }, 3000)

    img.onload = () => {
      clearTimeout(timeout)
      resolve(true)
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve(false)
    }

    const url = new URL(baseUrl)
    img.src = `${url.origin}/favicon.ico?_=${timestamp}`
  })
}

function getCategoryName(categoryId: string, categories: Category[]): string {
  const category = categories.find((cat: Category) => cat.id === categoryId)
  return category ? category.name : "Outros"
}

function groupServicesByCategory(services: Service[], categories: Category[]): Record<string, Service[]> {
  const grouped: Record<string, Service[]> = {}

  categories.forEach((category: Category) => {
    grouped[category.id] = []
  })

  services.forEach((service: Service) => {
    const category = service.category || "outros"
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(service)
  })

  Object.keys(grouped).forEach((categoryId: string) => {
    grouped[categoryId].sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  return grouped
}

interface SortableCategoryProps {
  category: Category
  children: React.ReactNode
  isEditMode: boolean
}

function SortableCategory({ category, children, isEditMode }: SortableCategoryProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled: !isEditMode,
  })

  const [isOpen, setIsOpen] = useState(true)
  const serviceStatus = useContext(ServiceStatusContext) as Record<string, boolean>

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
    opacity: isDragging ? 0.5 : 1,
  }

  const totalServices = Array.isArray(children) ? children.length : 0
  let activeServices = 0

  if (Array.isArray(children) && children.length > 0) {
    const serviceIds = children
      .map((child) => {
        if (child && child.props && child.props.service && child.props.service.id) {
          return child.props.service.id
        }
        return null
      })
      .filter(Boolean)

    activeServices = serviceIds.filter((id) => serviceStatus[id]).length
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-8">
      <div className="border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTIiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA1MiAyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNTlkMGIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTEwIDBsMTAgMThoMjBMMzAgMEgxMHptMTAgMThMMTAgMzZoMjBsMTAtMThIMjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat opacity-30 z-0"></div>

        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400/80 via-amber-500/60 to-yellow-400/80"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            {isEditMode && (
              <button
                className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300">{category.name}</h2>
            <Badge
              variant="outline"
              className="bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
            >
              {activeServices}/{totalServices}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-9 p-0 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronUp className={`h-4 w-4 transition-transform ${isOpen ? "" : "rotate-180"}`} />
            <span className="sr-only">Toggle</span>
          </Button>
        </div>

        {isOpen && <div className="mt-6 relative z-10">{children}</div>}
      </div>
    </div>
  )
}

interface SortableServiceCardProps {
  service: Service
  status: boolean
  isCheckingStatus: boolean
  isEditMode: boolean
  onToggleFavorite: (serviceId: string) => void
}

function SortableServiceCard({ service, status, isCheckingStatus, isEditMode, onToggleFavorite }: SortableServiceCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
    disabled: !isEditMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  }

  const isOnline = status === true

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? "z-10" : ""}`}>
      <Card
        className={`overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-yellow-500/5 hover:border-yellow-300/50 group h-full flex flex-col ${
          isDragging ? "shadow-lg border-yellow-300/50" : ""
        } relative`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 -mt-12 -mr-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full opacity-30 z-0"></div>

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTIiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA1MiAyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNTlkMGIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTEwIDBsMTAgMThoMjBMMzAgMEgxMHptMTAgMThMMTAgMzZoMjBsMTAtMThIMjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat opacity-30 z-0"></div>

        {isEditMode && (
          <div
            className="absolute left-2 top-4 cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted z-10"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <CardHeader className={`pb-2 relative ${isEditMode ? "pl-10" : ""} z-10`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-900/30 p-2 shadow-sm border border-yellow-200/50 dark:border-yellow-700/30">
              {service.logo ? (
                <img
                  src={service.logo || "/placeholder.svg"}
                  alt={`${service.name} logo`}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-yellow-200/50 dark:bg-yellow-700/30 rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-16">
              <h2 className="text-lg font-medium truncate" title={service.name}>
                {service.name}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2 h-10" title={service.description}>
                {service.description}
              </p>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
              {isCheckingStatus ? (
                <Skeleton className="h-4 w-14 rounded-full" />
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={isOnline ? "default" : "destructive"}
                        className={`
                          ${
                            isOnline
                              ? "bg-green-500/20 text-green-600 hover:bg-green-500/30 dark:bg-green-500/30 dark:text-green-400"
                              : "bg-red-500/20 text-red-600 hover:bg-red-500/30 dark:bg-red-500/30 dark:text-red-400"
                          }
                          flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs
                        `}
                      >
                        {isOnline ? (
                          <>
                            <CheckCircle className="h-2.5 w-2.5" />
                            <span>Online</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-2.5 w-2.5" />
                            <span>Offline</span>
                          </>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isOnline ? "Serviço está respondendo normalmente" : "Serviço não está respondendo"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <button
                onClick={() => onToggleFavorite(service.id)}
                className="flex items-center justify-center p-1.5 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                title={service.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Star
                  className={`h-4 w-4 ${
                    service.favorite ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                  } transition-colors`}
                />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4 flex-1 z-10">
          <div className="mt-2 text-sm text-muted-foreground opacity-80 truncate" title={service.url}>
            {service.url}
          </div>
        </CardContent>

        <CardFooter className="pt-0 mt-auto z-10">
          <Button
            asChild={!isEditMode}
            className="w-full rounded-lg transition-all shadow-sm hover:shadow-md"
            variant={isOnline ? "default" : "outline"}
            disabled={!isOnline || isEditMode}
          >
            {isEditMode ? (
              <span className="cursor-not-allowed opacity-70">Modo de Edição</span>
            ) : (
              <Link
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className={!isOnline ? "cursor-not-allowed opacity-70" : ""}
              >
                {isOnline ? "Acessar" : "Indisponível"}
              </Link>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

interface ExpandedCategories {
  [key: string]: boolean
}

interface ServiceStatus {
  [key: string]: boolean
}

export function ServiceGrid() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [services, setServices] = useState<Service[]>([])
  const [serviceCategories, setServiceCategories] = useState<Category[]>([])
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({})
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<ExpandedCategories>({})
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [originalServices, setOriginalServices] = useState<Service[]>([])
  const [originalCategories, setOriginalCategories] = useState<Category[]>([])

  const isMounted = useRef(true)

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })

  const sensors = useSensors(pointerSensor, keyboardSensor)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const categories = loadCategories()
        setServiceCategories(categories)

        setSelectedCategories(categories.map((cat) => cat.id))

        const initialExpanded: ExpandedCategories = {}
        categories.forEach((category) => {
          initialExpanded[category.id] = true
        })
        setExpandedCategories(initialExpanded)

        const loadedServices = loadServices()
        setServices(loadedServices)

        await checkAllServicesStatus(loadedServices)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as configurações",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted.current = false
    }
  }, [])

  const checkAllServicesStatus = async (servicesToCheck = services) => {
    if (isEditMode) return

    setIsCheckingStatus(true)
    const statusResults: ServiceStatus = {}

    for (const service of servicesToCheck) {
      statusResults[service.id] = await checkServiceStatus(service.url)
    }

    if (isMounted.current) {
      setServiceStatus(statusResults)
      setIsCheckingStatus(false)
    }

    return statusResults
  }

  useEffect(() => {
    if (isLoading || isEditMode) return

    checkAllServicesStatus()

    const intervalId = setInterval(() => {
      if (!isEditMode) {
        checkAllServicesStatus()
      }
    }, 60000)

    return () => clearInterval(intervalId)
  }, [services, isEditMode, isLoading])

  const filteredServices = services.filter(
    (service) =>
      (service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      selectedCategories.includes(service.category || "outros"),
  )

  const groupedServices = groupServicesByCategory(filteredServices, serviceCategories)

  const toggleCategorySelection = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  const saveOrder = () => {
    updateServicesOrder(services)
    updateCategoriesOrder(serviceCategories)
    setIsEditMode(false)

    toast({
      title: "Ordem salva",
      description: "A ordem personalizada foi salva com sucesso",
    })

    checkAllServicesStatus()
  }

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setServiceCategories((categories) => {
        const oldIndex = categories.findIndex((cat) => cat.id === active.id)
        const newIndex = categories.findIndex((cat) => cat.id === over?.id)

        const newCategories = arrayMove(categories, oldIndex, newIndex)

        return newCategories.map((cat, index) => ({
          ...cat,
          order: index,
        }))
      })

      toast({
        title: "Categoria movida",
        description: "A posição da categoria foi atualizada. Clique em Salvar Ordem para aplicar as mudanças.",
      })
    }
  }

  const handleServiceDragEnd = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event

    if (!over) return

    if (active.id !== over.id) {
      setServices((prevServices) => {
        const categoryServices = prevServices.filter((service) => service.category === categoryId)

        const oldIndex = categoryServices.findIndex((s) => s.id === active.id)
        const newIndex = categoryServices.findIndex((s) => s.id === over.id)

        if (oldIndex === -1 || newIndex === -1) return prevServices

        const newCategoryServices = arrayMove([...categoryServices], oldIndex, newIndex)

        const updatedCategoryServices = newCategoryServices.map((service, index) => ({
          ...service,
          order: index,
        }))

        return prevServices.map((service) => {
          if (service.category === categoryId) {
            const updatedService = updatedCategoryServices.find((s) => s.id === service.id)
            return updatedService || service
          }
          return service
        })
      })

      toast({
        title: "Serviço movido",
        description: "A posição do serviço foi atualizada. Clique em Salvar Ordem para aplicar as mudanças.",
        duration: 3000,
      })
    }
  }

  const handleFavoritesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    if (active.id !== over.id) {
      setServices((prevServices) => {
        const favoriteServices = prevServices.filter((service) => service.favorite)

        const oldIndex = favoriteServices.findIndex((s) => s.id === active.id)
        const newIndex = favoriteServices.findIndex((s) => s.id === over.id)

        if (oldIndex === -1 || newIndex === -1) return prevServices

        const newFavoriteServices = arrayMove([...favoriteServices], oldIndex, newIndex)

        const updatedFavoriteServices = newFavoriteServices.map((service, index) => ({
          ...service,
          order: index,
        }))

        return prevServices.map((service) => {
          if (service.favorite) {
            const updatedService = updatedFavoriteServices.find((s) => s.id === service.id)
            return updatedService || service
          }
          return service
        })
      })

      toast({
        title: "Favorito movido",
        description: "A posição do favorito foi atualizada. Clique em Salvar Ordem para aplicar as mudanças.",
        duration: 3000,
      })
    }
  }

  const sortedCategories = [...serviceCategories].sort((a, b) => (a.order || 0) - (b.order || 0))

  const toggleEditMode = (newEditMode: boolean) => {
    if (newEditMode && !isEditMode) {
      setOriginalServices([...services])
      setOriginalCategories([...serviceCategories])
    }
    setIsEditMode(newEditMode)
  }

  const discardChanges = () => {
    setServices(originalServices)
    setServiceCategories(originalCategories)
    setIsEditMode(false)

    toast({
      title: "Alterações descartadas",
      description: "As alterações na ordem foram descartadas",
    })
  }

  const handleToggleFavorite = (serviceId: string) => {
    const updatedService = toggleFavorite(serviceId)

    if (updatedService) {
      setServices((prevServices) =>
        prevServices.map((service) =>
          service.id === serviceId ? { ...service, favorite: updatedService.favorite } : service,
        ),
      )

      toast({
        title: updatedService.favorite ? "Adicionado aos favoritos" : "Removido dos favoritos",
        description: `${updatedService.name} foi ${updatedService.favorite ? "adicionado aos" : "removido dos"} favoritos`,
        duration: 3000,
      })
    }
  }

  const servicePointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })

  const serviceKeyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })

  const serviceSensors = useSensors(servicePointerSensor, serviceKeyboardSensor)

  const CategoryServices = ({ category, services }: { category: Category; services: Service[] }) => {
    return (
      <DndContext
        sensors={serviceSensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => handleServiceDragEnd(event, category.id)}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext items={services.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <SortableServiceCard
                key={service.id}
                service={service}
                status={serviceStatus[service.id] || false}
                isCheckingStatus={isCheckingStatus}
                isEditMode={isEditMode}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  const favoritePointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })

  const favoriteKeyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })

  const favoriteSensors = useSensors(favoritePointerSensor, favoriteKeyboardSensor)

  const FavoritesSection = () => {
    const favoriteServices = services.filter((service) => service.favorite)

    if (favoriteServices.length === 0) {
      return null
    }

    return (
      <div className="mb-8">
        <div className="border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTIiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA1MiAyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNTlkMGIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTEwIDBsMTAgMThoMjBMMzAgMEgxMHptMTAgMThMMTAgMzZoMjBsMTAtMThIMjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat opacity-30 z-0"></div>

          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400/80 via-amber-500/60 to-yellow-400/80"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
              <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300">Favoritos</h2>
              <Badge
                variant="outline"
                className="bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
              >
                {favoriteServices.length}
              </Badge>
            </div>
          </div>

          <div className="mt-6 relative z-10">
            <DndContext
              sensors={favoriteSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFavoritesDragEnd}
              modifiers={[restrictToParentElement]}
            >
              <SortableContext items={favoriteServices.map((s) => s.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {favoriteServices.map((service) => (
                    <SortableServiceCard
                      key={service.id}
                      service={service}
                      status={serviceStatus[service.id] || false}
                      isCheckingStatus={isCheckingStatus}
                      isEditMode={isEditMode}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 bg-muted rounded-xl animate-pulse"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-6">
            <div className="h-16 bg-muted rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-48 bg-muted rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ServiceStatusContext.Provider value={serviceStatus}>
      <div>
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar serviço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 h-12 text-base rounded-xl"
              disabled={isEditMode}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {searchQuery && filteredServices.length > 0 && (
                <Badge variant="outline" className="bg-primary/10">
                  {filteredServices.length} {filteredServices.length === 1 ? "resultado" : "resultados"}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 gap-2 rounded-xl" disabled={isEditMode}>
                  <Filter className="h-4 w-4" />
                  <span>Categorias</span>
                  <Badge variant="secondary" className="ml-1">
                    {selectedCategories.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {serviceCategories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategorySelection(category.id)}
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {!isEditMode ? (
              <Button variant="outline" className="h-12 gap-2 rounded-xl" onClick={() => toggleEditMode(true)}>
                <Edit className="h-4 w-4" />
                <span>Modo de Edição</span>
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={discardChanges} className="h-12 gap-2 rounded-xl">
                  <X className="h-4 w-4" />
                  <span>Descartar</span>
                </Button>
                <Button onClick={saveOrder} className="h-12 gap-2 rounded-xl">
                  <Save className="h-4 w-4" />
                  <span>Salvar Ordem</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditMode && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-200">
            <p className="text-sm">
              <strong>Modo de Edição Ativado:</strong> Arraste e solte para reordenar categorias e serviços. Clique em
              "Salvar Ordem" quando terminar.
            </p>
          </div>
        )}

        {services.length === 0 && (
          <div className="p-8 text-center border rounded-xl bg-muted/20">
            <h3 className="text-xl font-medium mb-2">Nenhum serviço encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione serviços na página de configurações ou importe um arquivo de configuração.
            </p>
            <Button asChild>
              <Link href="/settings">Ir para Configurações</Link>
            </Button>
          </div>
        )}

        {services.length > 0 && !searchQuery && <FavoritesSection />}

        {services.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
            modifiers={[restrictToParentElement]}
          >
            <SortableContext items={sortedCategories.map((cat) => cat.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {sortedCategories.map((category) => {
                  if (!groupedServices[category.id] || groupedServices[category.id].length === 0) {
                    return null
                  }

                  const categoryServices = groupedServices[category.id]
                  const sortedCategoryServices = [...categoryServices].sort((a, b) => (a.order || 0) - (b.order || 0))

                  return (
                    <SortableCategory key={category.id} category={category} isEditMode={isEditMode}>
                      <CategoryServices category={category} services={sortedCategoryServices} />
                    </SortableCategory>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </ServiceStatusContext.Provider>
  )
}
