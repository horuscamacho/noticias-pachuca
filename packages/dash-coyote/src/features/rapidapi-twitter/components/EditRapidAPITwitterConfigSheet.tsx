// 🔧 Edit RapidAPI Twitter Config Sheet - Stub Component
import { Button } from '@/components/ui/button'
import { IconEdit } from '@tabler/icons-react'
import type { RapidAPITwitterConfig } from '../types/rapidapi-twitter.types'

interface EditRapidAPITwitterConfigSheetProps {
  config: RapidAPITwitterConfig
  onConfigUpdated?: () => void
}

export function EditRapidAPITwitterConfigSheet({ config, onConfigUpdated }: EditRapidAPITwitterConfigSheetProps) {
  // TODO: Implement edit config sheet
  return (
    <Button variant="outline" size="sm" onClick={() => console.log('Edit config:', config.id)}>
      <IconEdit className="h-4 w-4" />
    </Button>
  )
}