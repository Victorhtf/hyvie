"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, FileCode, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LogoSelector } from "@/components/logo-selector"
import {
  loadServices,
  loadCategories,
  addService,
  removeService,
  type Service,
  type Category,
} from "@/lib/service-store"

export default function SettingsPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [serviceCategories, setServiceCategories] = useState<Category[]>([])

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    url: "",
    logo: "",
    category: "outros",
  })

  useEffect(() => {
    setServices(loadServices())
    setServiceCategories(loadCategories())
  }, [])

  const handleAddService = () => {
    if (!newService.name || !newService.url) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e URL são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const addedService = addService(newService)
      setServices((prev) => [...prev, addedService])

      setNewService({
        name: "",
        description: "",
        url: "",
        logo: "",
        category: "outros",
      })

      toast({
        title: "Serviço adicionado",
        description: `${newService.name} foi adicionado com sucesso`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao adicionar o serviço",
        variant: "destructive",
      })
    }
  }

  const handleRemoveService = (id: string) => {
    try {
      const removedService = removeService(id)
      if (removedService) {
        setServices(services.filter((service) => service.id !== id))
        toast({
          title: "Serviço removido",
          description: `${removedService.name} foi removido com sucesso`,
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao remover serviço",
        description: "Ocorreu um erro ao remover o serviço",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild className="rounded-xl">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              Configurações
            </h1>
          </div>
          <p className="mt-2 text-muted-foreground">Gerencie os serviços do seu homelab</p>
        </div>

        <div className="grid gap-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gerenciamento de Serviços</h2>
            <Button variant="outline" asChild className="gap-2 rounded-xl">
              <Link href="/settings/config">
                <FileCode className="h-4 w-4" />
                <span>Configuração Avançada (YAML/JSON)</span>
              </Link>
            </Button>
          </div>

          <Card className="overflow-hidden border-primary/10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 to-primary/30"></div>
            <CardHeader>
              <CardTitle>Adicionar Novo Serviço</CardTitle>
              <CardDescription>Adicione um novo serviço ao seu dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome do serviço"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="http://exemplo.local"
                    value={newService.url}
                    onChange={(e) => setNewService({ ...newService, url: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição do serviço"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <LogoSelector
                  value={newService.logo}
                  onChange={(value) => setNewService({ ...newService, logo: value })}
                  serviceUrl={newService.url}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={newService.category}
                  onValueChange={(value) => setNewService({ ...newService, category: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddService} className="w-full rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Serviço
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-primary/10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 to-primary/30"></div>
            <CardHeader>
              <CardTitle>Serviços Existentes</CardTitle>
              <CardDescription>Gerencie os serviços existentes no seu dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {services.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl bg-muted/20">
                    <h3 className="text-xl font-medium mb-2">Nenhum serviço encontrado</h3>
                    <p className="text-muted-foreground mb-4">Adicione um novo serviço usando o formulário acima.</p>
                  </div>
                ) : (
                  /* Agrupar serviços por categoria */
                  serviceCategories
                    .sort((a, b) => a.name.localeCompare(b.name)) // Ordenar categorias alfabeticamente
                    .map((category) => {
                      const categoryServices = services
                        .filter((service) => service.category === category.id)
                        .sort((a, b) => a.name.localeCompare(b.name)) // Ordenar serviços alfabeticamente

                      if (categoryServices.length === 0) return null

                      return (
                        <div key={category.id} className="space-y-2">
                          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                            {category.name}
                          </h3>
                          <div className="space-y-2">
                            {categoryServices.map((service) => (
                              <div
                                key={service.id}
                                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {service.logo && (
                                    <img
                                      src={service.logo || "/placeholder.svg"}
                                      alt={`${service.name} logo`}
                                      className="w-10 h-10 object-contain rounded-lg bg-background p-1"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.svg"
                                      }}
                                    />
                                  )}
                                  <div>
                                    <h3 className="font-medium">{service.name}</h3>
                                    <p className="text-sm text-muted-foreground">{service.url}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveService(service.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remover {service.name}</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
