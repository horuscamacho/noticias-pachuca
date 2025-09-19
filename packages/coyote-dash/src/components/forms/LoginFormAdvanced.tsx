// 🔐 Advanced Login Form con React Hook Form + Zod + shadcn/ui
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@nanostores/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { auth } from "@/lib/auth/utils";
import { $authError, $isLoading } from "@/stores/auth";

interface LoginFormAdvancedProps {
  onSuccess?: () => void;
  className?: string;
}

export function LoginFormAdvanced({ onSuccess, className }: LoginFormAdvancedProps) {
  const [showPassword, setShowPassword] = useState(false);
  const authError = useStore($authError);
  const isLoading = useStore($isLoading);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onBlur", // Validar al perder foco
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await auth.login({
        email: data.email,
        password: data.password,
        deviceId: data.deviceId,
      });

      console.log('✅ Login exitoso, ejecutando callback...');

      // Callback de éxito con redirección forzada
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback: redirigir directamente si no hay callback
        window.location.href = '/dashboard';
      }

    } catch (error) {
      // El error ya se maneja en el store
      console.error('Login failed:', error);
    }
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="tu@email.com"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="pr-10"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember Me */}
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Recordar mi sesión
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Error Display */}
          {authError && (
            <Alert variant="destructive">
              <AlertDescription>
                {authError.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>

          {/* Links */}
          <div className="text-center space-y-2">
            <a
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
            <div className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <a
                href="/register"
                className="underline-offset-4 hover:underline text-primary"
              >
                Regístrate aquí
              </a>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}