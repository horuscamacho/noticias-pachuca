// 🔄 Extraction Modal - Stub Component
import type { RapidAPITwitterUser } from '../types/rapidapi-twitter.types'

interface ExtractionModalProps {
  isOpen: boolean
  onClose: () => void
  onExtract: (userId: string, startDate?: Date, endDate?: Date) => Promise<void>
  selectedUser: RapidAPITwitterUser | null
}

export function ExtractionModal({ isOpen, onClose, onExtract, selectedUser }: ExtractionModalProps) {
  // TODO: Implement extraction modal
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Extraer Tweets</h2>
        <p>TODO: Implement extraction modal for {selectedUser?.username}</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}