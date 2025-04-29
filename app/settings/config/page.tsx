"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AlertCircle, ArrowLeft, Check, Download, Edit, Eye, FileCode, Loader2, Save, Upload, X } from "lucide-react"
import Link from "next/link"
import yaml from "js-yaml"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getFullConfig, saveFullConfig } from "@/lib/service-store"

export default function ConfigPage() {
  const { toast } = useToast()
  const [configFormat, setConfigFormat] = useState<"json" | "yaml">("yaml")
  const [configText, setConfigText] = useState("")
  const [originalConfigText, setOriginalConfigText] = useState("")
  const [isValid, setIsValid] = useState(true)
  const [validationError, setValidationError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingConfig, setPendingConfig] = useState<any>(null)

  useEffect(() => {
    try {
      setIsLoading(true)
      const config = getFullConfig()

      updateConfigText(config)
      setOriginalConfigText(
        configFormat === "json" ? JSON.stringify(config, null, 2) : yaml.dump(config, { indent: 2, lineWidth: -1 }),
      )
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
      setIsValid(false)
      setValidationError("Erro ao carregar configuração")
    } finally {
      setIsLoading(false)
    }
  }, [configFormat])

  const updateConfigText = (config: any) => {
    try {
      if (configFormat === "json") {
        setConfigText(JSON.stringify(config, null, 2))
      } else {
        setConfigText(yaml.dump(config, { indent: 2, lineWidth: -1 }))
      }
      setIsValid(true)
      setValidationError("")
    } catch (error) {
      console.error("Erro ao formatar configuração:", error)
      setIsValid(false)
      setValidationError("Erro ao formatar configuração")
    }
  }

  const validateConfig = (configStr: string) => {
    try {
      let config
      if (configFormat === "json") {
        config = JSON.parse(configStr)
      } else {
        config = yaml.load(configStr)
      }

      if (!config || typeof config !== "object") {
        throw new Error("Configuração inválida: deve ser um objeto")
      }

      if (!config.services || !Array.isArray(config.services)) {
        throw new Error("Configuração inválida: 'services' deve ser um array")
      }

      if (!config.categories || !Array.isArray(config.categories)) {
        throw new Error("Configuração inválida: 'categories' deve ser um array")
      }

      config.services.forEach((service: any, index: number) => {
        if (!service.id) throw new Error(`Serviço #${index + 1} não tem ID`)
        if (!service.name) throw new Error(`Serviço #${index + 1} não tem nome`)
        if (!service.url) throw new Error(`Serviço #${index + 1} não tem URL`)
        if (!service.category) throw new Error(`Serviço #${index + 1} não tem categoria`)

        if (!config.categories.some((cat: any) => cat.id === service.category)) {
          throw new Error(`Serviço #${index + 1} usa categoria '${service.category}' que não existe`)
        }
      })

      config.categories.forEach((category: any, index: number) => {
        if (!category.id) throw new Error(`Categoria #${index + 1} não tem ID`)
        if (!category.name) throw new Error(`Categoria #${index + 1} não tem nome`)
      })

      return { valid: true, config }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  const handleConfigChange = (newText: string) => {
    setConfigText(newText)

    const validation = validateConfig(newText)
    setIsValid(validation.valid)
    if (!validation.valid) {
      setValidationError(validation.error as string)
    } else {
      setValidationError("")
    }
  }

  const confirmSave = () => {
    const validation = validateConfig(configText)

    if (!validation.valid) {
      toast({
        title: "Configuração inválida",
        description: validation.error as string,
        variant: "destructive",
      })
      return
    }

    setPendingConfig(validation.config)
    setShowConfirmDialog(true)
  }

  const applyConfirmedConfig = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      saveFullConfig(pendingConfig)
      setOriginalConfigText(configText)

      toast({
        title: "Configuração salva",
        description: "Sua configuração foi salva com sucesso",
      })

      setIsValid(true)
      setValidationError("")
      setIsEditing(false)
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar a configuração",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setShowConfirmDialog(false)
    }
  }

  const discardChanges = () => {
    setConfigText(originalConfigText)
    setIsEditing(false)
    setIsValid(true)
    setValidationError("")

    toast({
      title: "Alterações descartadas",
      description: "Suas alterações foram descartadas",
    })
  }

  const handleExportConfig = () => {
    try {
      const content = configText
      const filename = `homelab-config.${configFormat}`
      const contentType = configFormat === "json" ? "application/json" : "text/yaml"

      const blob = new Blob([content], { type: contentType })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Configuração exportada",
        description: `Arquivo ${filename} baixado com sucesso`,
      })
    } catch (error) {
      console.error("Erro ao exportar configuração:", error)
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar a configuração",
        variant: "destructive",
      })
    }
  }

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let config

        if (file.name.endsWith(".json")) {
          config = JSON.parse(content)
          setConfigFormat("json")
        } else {
          config = yaml.load(content)
          setConfigFormat("yaml")
        }

        const validation = validateConfig(
          configFormat === "json" ? JSON.stringify(config, null, 2) : yaml.dump(config, { indent: 2, lineWidth: -1 }),
        )

        if (!validation.valid) {
          throw new Error(validation.error as string)
        }

        updateConfigText(config)
        setIsEditing(true)

        toast({
          title: "Configuração importada",
          description: "Arquivo importado com sucesso. Revise e clique em Salvar para aplicar as mudanças.",
        })
      } catch (error) {
        console.error("Erro ao importar configuração:", error)
        toast({
          title: "Erro ao importar",
          description: error instanceof Error ? error.message : "O arquivo selecionado não é válido",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    event.target.value = ""
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild className="rounded-xl">
              <Link href="/settings">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              Configuração Avançada
            </h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Edite a configuração do seu dashboard diretamente em YAML ou JSON
          </p>
        </div>

        <Card className="overflow-hidden border-primary/10 mb-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 to-primary/30"></div>
          <CardHeader>
            <CardTitle>Editor de Configuração</CardTitle>
            <CardDescription>Edite, importe ou exporte a configuração do seu dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <Tabs
                    value={configFormat}
                    onValueChange={(v) => setConfigFormat(v as "json" | "yaml")}
                    className="w-full sm:w-auto"
                    disabled={isEditing}
                  >
                    <TabsList>
                      <TabsTrigger value="yaml" disabled={isEditing}>
                        YAML
                      </TabsTrigger>
                      <TabsTrigger value="json" disabled={isEditing}>
                        JSON
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleExportConfig}
                      className="gap-2 rounded-xl"
                      disabled={isEditing}
                    >
                      <Download className="h-4 w-4" />
                      <span>Exportar</span>
                    </Button>

                    <Button variant="outline" className="gap-2 rounded-xl" asChild disabled={isEditing}>
                      <label className={isEditing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                        <Upload className="h-4 w-4" />
                        <span>Importar</span>
                        <input
                          type="file"
                          accept={configFormat === "json" ? ".json" : ".yaml,.yml"}
                          className="hidden"
                          onChange={handleImportConfig}
                          disabled={isEditing}
                        />
                      </label>
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex justify-end mb-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-2 rounded-xl"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Modo de Edição</span>
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={discardChanges} className="gap-2 rounded-xl">
                          <X className="h-4 w-4" />
                          <span>Descartar</span>
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={confirmSave}
                          className="gap-2 rounded-xl"
                          disabled={!isValid || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Salvar</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    {!isEditing && (
                      <div className="absolute top-2 right-2 z-10 bg-background/90 px-3 py-1 rounded-md shadow-sm border text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>Modo de visualização</span>
                      </div>
                    )}

                    {isEditing && (
                      <div className="absolute top-2 right-2 z-10 bg-background/90 px-3 py-1 rounded-md shadow-sm border text-xs text-muted-foreground flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        <span>Modo de edição</span>
                      </div>
                    )}

                    <Textarea
                      value={configText}
                      onChange={(e) => handleConfigChange(e.target.value)}
                      className={`font-mono text-sm h-[500px] resize-none p-4 overflow-auto ${
                        !isValid ? "border-red-500 focus-visible:ring-red-500" : ""
                      } ${!isEditing ? "bg-muted/30" : ""}`}
                      placeholder={`Insira sua configuração em ${configFormat.toUpperCase()}`}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      style={{ cursor: isEditing ? "text" : "default" }}
                    />
                  </div>
                  {!isValid && (
                    <div className="text-destructive text-sm mt-2 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Erro de validação: {validationError}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 to-primary/30"></div>
          <CardHeader>
            <CardTitle>Estrutura da Configuração</CardTitle>
            <CardDescription>Referência para a estrutura de configuração</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Exemplo de Configuração
                </h3>
                <pre className="text-xs overflow-auto p-2 bg-card rounded-lg">
                  {configFormat === "yaml"
                    ? `categories:
  - id: gerenciamento
    name: Gerenciamento
    order: 0
  - id: seguranca
    name: Segurança
    order: 1

services:
  - id: portainer
    name: Portainer
    description: Gerenciamento de contêineres Docker
    url: http://portainer.local
    logo: /logos/portainer.png
    category: gerenciamento
    order: 0
  - id: vaultwarden
    name: Vaultwarden
    description: Gerenciador de senhas
    url: http://vaultwarden.local
    logo: /logos/vaultwarden.png
    category: seguranca
    order: 0`
                    : `{
  "categories": [
    {
      "id": "gerenciamento",
      "name": "Gerenciamento",
      "order": 0
    },
    {
      "id": "seguranca",
      "name": "Segurança",
      "order": 1
    }
  ],
  "services": [
    {
      "id": "portainer",
      "name": "Portainer",
      "description": "Gerenciamento de contêineres Docker",
      "url": "http://portainer.local",
      "logo": "/logos/portainer.png",
      "category": "gerenciamento",
      "order": 0
    },
    {
      "id": "vaultwarden",
      "name": "Vaultwarden",
      "description": "Gerenciador de senhas",
      "url": "http://vaultwarden.local",
      "logo": "/logos/vaultwarden.png",
      "category": "seguranca",
      "order": 0
    }
  ]
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Campos Obrigatórios</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    <strong>categories</strong>: Array de categorias
                  </li>
                  <li>
                    <strong>services</strong>: Array de serviços
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Categoria</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    <strong>id</strong>: Identificador único (obrigatório)
                  </li>
                  <li>
                    <strong>name</strong>: Nome de exibição (obrigatório)
                  </li>
                  <li>
                    <strong>order</strong>: Ordem de exibição (opcional)
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Serviço</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    <strong>id</strong>: Identificador único (obrigatório)
                  </li>
                  <li>
                    <strong>name</strong>: Nome de exibição (obrigatório)
                  </li>
                  <li>
                    <strong>description</strong>: Descrição do serviço (opcional)
                  </li>
                  <li>
                    <strong>url</strong>: URL do serviço (obrigatório)
                  </li>
                  <li>
                    <strong>logo</strong>: Caminho para o logo (opcional)
                  </li>
                  <li>
                    <strong>category</strong>: ID da categoria (obrigatório)
                  </li>
                  <li>
                    <strong>order</strong>: Ordem dentro da categoria (opcional)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a aplicar as alterações na configuração. Esta ação irá substituir a configuração atual.
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={applyConfirmedConfig}>
              <Check className="mr-2 h-4 w-4" />
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
