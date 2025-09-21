"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRange {
  startDate?: Date
  endDate?: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  className?: string
  disabled?: boolean
}

export function DateRangePicker({
  value,
  onChange,
  className,
  disabled = false
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const formatDateRange = () => {
    if (!value?.startDate && !value?.endDate) {
      return "Seleccionar rango de fechas"
    }

    if (value.startDate && value.endDate) {
      return `${format(value.startDate, "dd/MM/yyyy")} - ${format(value.endDate, "dd/MM/yyyy")}`
    }

    if (value.startDate) {
      return `Desde ${format(value.startDate, "dd/MM/yyyy")}`
    }

    if (value.endDate) {
      return `Hasta ${format(value.endDate, "dd/MM/yyyy")}`
    }

    return "Seleccionar rango de fechas"
  }

  const handleStartDateChange = (date: Date | undefined) => {
    onChange?.({
      startDate: date,
      endDate: value?.endDate
    })
  }

  const handleEndDateChange = (date: Date | undefined) => {
    onChange?.({
      startDate: value?.startDate,
      endDate: date
    })
  }

  const clearDates = () => {
    onChange?.({
      startDate: undefined,
      endDate: undefined
    })
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !value?.startDate && !value?.endDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Fecha de inicio</label>
            <DatePicker
              date={value?.startDate}
              onSelect={handleStartDateChange}
              placeholder="Fecha de inicio"
              className="w-full"
              disabled={disabled}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Fecha de fin</label>
            <DatePicker
              date={value?.endDate}
              onSelect={handleEndDateChange}
              placeholder="Fecha de fin"
              className="w-full"
              disabled={disabled}
            />
          </div>
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearDates}
              disabled={disabled}
            >
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={disabled}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}