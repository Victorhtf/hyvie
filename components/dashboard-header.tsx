"use client"

import { Hexagon, RefreshCw, Settings } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-xl">
            <Hexagon className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              Hyvie
            </h1>
            <p className="text-muted-foreground">Acesse todos os seus serviços em um só lugar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => window.location.reload()} className="rounded-xl">
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Atualizar</span>
          </Button>
          <ThemeToggle />
          <Button variant="outline" size="icon" asChild className="rounded-xl">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Configurações</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
