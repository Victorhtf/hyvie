"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ImageIcon, Loader2, RefreshCw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

async function detectFavicon(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url)
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ""}`

    const faviconPaths = [
      "/favicon.ico",
      "/favicon.png",
      "/assets/favicon.ico",
      "/assets/favicon.png",
      "/images/favicon.ico",
      "/images/favicon.png",
    ]

    for (const path of faviconPaths) {
      const faviconUrl = `${baseUrl}${path}`
      const response = await fetch(faviconUrl, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
      })
      if (response.ok) {
        return faviconUrl
      }
    }

    return null
  } catch (error) {
    console.error("Erro ao detectar favicon:", error)
    return null
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

interface LogoSelectorProps {
  value: string
  onChange: (value: string) => void
  serviceUrl: string
}

export function LogoSelector({ value, onChange, serviceUrl }: LogoSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>("url")
  const [customUrl, setCustomUrl] = useState<string>(value || "")
  const [isDetecting, setIsDetecting] = useState<boolean>(false)
  const [previewError, setPreviewError] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isBase64Image = value && value.startsWith("data:image/")

  useEffect(() => {
    if (isBase64Image) {
      setActiveTab("upload")
    } else if (value) {
      setActiveTab("url")
    }
  }, [])

  useEffect(() => {
    if (value !== customUrl) {
      setCustomUrl(value || "")
    }
  }, [value, customUrl])

  const handleUrlChange = (newUrl: string) => {
    setCustomUrl(newUrl)
    onChange(newUrl)
  }

  const handleDetectFavicon = async () => {
    if (!serviceUrl) return

    setIsDetecting(true)
    try {
      const faviconUrl = await detectFavicon(serviceUrl)
      if (faviconUrl) {
        handleUrlChange(faviconUrl)
      }
    } catch (error) {
      console.error("Erro ao detectar favicon:", error)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("O arquivo selecionado não é uma imagem")
      }

      if (file.size > 1024 * 1024) {
        throw new Error("A imagem deve ter menos de 1MB")
      }

      const base64 = await fileToBase64(file)

      onChange(base64)
      setCustomUrl(base64)
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      alert(error instanceof Error ? error.message : "Erro ao processar imagem")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handlePreviewError = () => {
    setPreviewError(true)
  }

  useEffect(() => {
    setPreviewError(false)
  }, [customUrl])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="url">URL Personalizada</TabsTrigger>
          <TabsTrigger value="upload">Upload de Imagem</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4 pt-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="logo-url">URL do Logo</Label>
              <div className="flex mt-1">
                <Input
                  id="logo-url"
                  placeholder="https://exemplo.com/logo.png"
                  value={customUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="rounded-l-xl rounded-r-none flex-1"
                />
                <Button
                  variant="outline"
                  className="rounded-l-none rounded-r-xl"
                  onClick={handleDetectFavicon}
                  disabled={!serviceUrl || isDetecting}
                >
                  {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="sr-only">Detectar</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {serviceUrl
                  ? "Clique no botão para tentar detectar o favicon automaticamente."
                  : "Adicione a URL do serviço primeiro para detectar o favicon automaticamente."}
              </p>
            </div>

            {customUrl && !isBase64Image && (
              <div className="ml-2">
                <Label>Visualização</Label>
                <div className="mt-1 w-12 h-12 flex items-center justify-center rounded-xl bg-muted p-2 shadow-sm">
                  {previewError ? (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <img
                      src={customUrl || "/placeholder.svg"}
                      alt="Logo preview"
                      className="w-10 h-10 object-contain"
                      onError={handlePreviewError}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="pt-2">
          <div className="space-y-4">
            <div>
              <Label>Upload de Imagem</Label>
              <div className="mt-1 border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                <div className="flex flex-col items-center justify-center gap-2">
                  {isBase64Image ? (
                    <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-muted p-2 shadow-sm mb-2">
                      <img
                        src={value || "/placeholder.svg"}
                        alt="Logo preview"
                        className="w-14 h-14 object-contain"
                        onError={handlePreviewError}
                      />
                    </div>
                  ) : (
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  )}

                  <Button variant="outline" onClick={triggerFileInput} disabled={isUploading} className="mt-2">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : isBase64Image ? (
                      "Trocar Imagem"
                    ) : (
                      "Selecionar Imagem"
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos suportados: JPG, PNG, GIF, SVG. Tamanho máximo: 1MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
