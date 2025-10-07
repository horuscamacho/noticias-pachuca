// 🐦 Create RapidAPI Twitter User Sheet - Stub Component
import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'

interface CreateRapidAPITwitterUserSheetProps {
  onUserCreated?: () => void
}

export function CreateRapidAPITwitterUserSheet({ onUserCreated }: CreateRapidAPITwitterUserSheetProps) {
  // TODO: Implement create user sheet
  return (
    <Button onClick={() => console.log('Create Twitter user')}>
      <IconPlus className="h-4 w-4 mr-2" />
      Nuevo Usuario
    </Button>
  )
}