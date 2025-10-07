// 🐦 User Details Modal - Stub Component
import type { RapidAPITwitterUser } from '../types/rapidapi-twitter.types'

interface UserDetailsModalProps {
  user: RapidAPITwitterUser
  isOpen: boolean
  onClose: () => void
  onUpdateExtractionConfig: (config: any) => void
}

export function UserDetailsModal({ user, isOpen, onClose, onUpdateExtractionConfig }: UserDetailsModalProps) {
  // TODO: Implement user details modal
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Detalles de @{user.username}</h2>
        <p>TODO: Implement user details modal</p>
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