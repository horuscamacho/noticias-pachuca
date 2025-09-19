// 🔐 Login Form - shadcn/ui + React Hook Form + Zod
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '../services/authService'
import { useAuthStore } from '../stores/authStore'

// Zod schema para validación
const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').min(1, 'Contraseña requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps extends React.ComponentProps<'div'> {
  onSuccess?: () => void
}

export function LoginForm({ className, onSuccess, ...props }: LoginFormProps) {
  const login = useAuthStore((state) => state.login)
  const setLoading = useAuthStore((state) => state.setLoading)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: (data) => {
      login(data.user, data.tokens)
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Login failed:', error)
      form.setError('root', {
        message: 'Credenciales inválidas. Verifica tu email y contraseña.',
      })
    },
    onSettled: () => {
      setLoading(false)
    },
  })

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  return (
    <div className={cn('space-y-6', className)} {...props}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Iniciar Sesión</h2>
        <p className="text-muted-foreground">
          Ingresa tu email y contraseña para acceder al panel
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Error global */}
        {form.formState.errors.root && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            {...form.register('email')}
            disabled={loginMutation.isPending}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="password">Contraseña</Label>
            <a
              href="/forgot-password"
              className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...form.register('password')}
            disabled={loginMutation.isPending}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <div className="text-center text-sm">
          ¿No tienes una cuenta?{' '}
          <a href="/register" className="underline underline-offset-4">
            Registrarse
          </a>
        </div>
      </form>
    </div>
  )
}