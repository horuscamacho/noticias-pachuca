// 🔐 Login Page
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { LoginForm } from '../../features/auth/components/LoginForm'

// Schema para search params
const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
  validateSearch: loginSearchSchema,
})

function LoginPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()

  const handleLoginSuccess = () => {
    // Navegar a la URL de redirección o dashboard
    router.navigate({
      to: redirect || '/dashboard',
      replace: true, // No agregar al historial
    })
  }

  return <LoginForm onSuccess={handleLoginSuccess} />
}