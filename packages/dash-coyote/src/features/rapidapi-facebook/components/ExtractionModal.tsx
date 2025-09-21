"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { IconRefresh } from "@tabler/icons-react"

interface DateRange {
  startDate?: Date
  endDate?: Date
}

interface ExtractionModalProps {
  pageId: string
  pageName: string
  onExtract: (pageId: string, startDate?: Date, endDate?: Date) => Promise<void>
  isLoading?: boolean
  children?: React.ReactNode
}

export function ExtractionModal({
  pageId,
  pageName,
  onExtract,
  isLoading = false,
  children
}: ExtractionModalProps) {
  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({})
  const [isExtracting, setIsExtracting] = useState(false)

  const handleExtract = async () => {
    try {
      setIsExtracting(true)
      await onExtract(pageId, dateRange.startDate, dateRange.endDate)
      setOpen(false)
      // Reset dates after successful extraction
      setDateRange({})
    } catch (error) {
      console.error('Error en extracción:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  const triggerButton = children || (
    <Button
      size="sm"
      variant="ghost"
      className="text-blue-600"
      disabled={isLoading}
      title="Extraer posts manualmente"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <IconRefresh className="w-4 h-4" />
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Extraer Posts</DialogTitle>
          <DialogDescription>
            Configurar extracción de posts para <strong>{pageName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="date-range" className="text-sm font-medium">
              Rango de fechas (opcional)
            </label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              disabled={isExtracting}
            />
            <p className="text-xs text-muted-foreground">
              Si no seleccionas fechas, se extraerán los posts más recientes
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExtracting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExtract}
            disabled={isExtracting}
            className="min-w-[100px]"
          >
            {isExtracting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Extrayendo...
              </>
            ) : (
              <>
                <IconRefresh className="w-4 h-4 mr-2" />
                Extraer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}