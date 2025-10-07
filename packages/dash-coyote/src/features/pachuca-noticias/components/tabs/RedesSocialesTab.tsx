"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconLock,
} from '@tabler/icons-react';

/**
 * 🌐 Tab de Redes Sociales
 * Funcionalidad de Fase 2 - Próximamente
 */
export function RedesSocialesTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                🌐 Redes Sociales
                <Badge variant="secondary">
                  <IconLock className="h-3 w-3 mr-1" />
                  Fase 2
                </Badge>
              </CardTitle>
              <CardDescription>
                Publicación automatizada en redes sociales
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <IconBrandFacebook className="h-12 w-12 text-blue-600 opacity-30" />
              <IconBrandTwitter className="h-12 w-12 text-sky-500 opacity-30" />
              <IconBrandInstagram className="h-12 w-12 text-pink-600 opacity-30" />
              <IconBrandLinkedin className="h-12 w-12 text-blue-700 opacity-30" />
            </div>

            <h3 className="text-lg font-semibold mb-2">
              Próximamente
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              La publicación en redes sociales estará disponible en la <strong>Fase 2</strong> del proyecto.
              Podrás publicar automáticamente tus noticias en Facebook, Twitter, Instagram y LinkedIn.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IconBrandFacebook className="h-5 w-5 text-blue-600" />
              Facebook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Publicación directa en páginas de Facebook</li>
              <li>• Programación de posts</li>
              <li>• Estadísticas de engagement</li>
              <li>• Carrusel de imágenes</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IconBrandTwitter className="h-5 w-5 text-sky-500" />
              Twitter / X
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Tweets automáticos con hashtags</li>
              <li>• Hilos (threads) generados por IA</li>
              <li>• Métricas de alcance</li>
              <li>• Respuestas automáticas</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IconBrandInstagram className="h-5 w-5 text-pink-600" />
              Instagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Posts con imágenes optimizadas</li>
              <li>• Stories automáticas</li>
              <li>• Hashtags estratégicos</li>
              <li>• Analytics de engagement</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IconBrandLinkedin className="h-5 w-5 text-blue-700" />
              LinkedIn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Artículos profesionales</li>
              <li>• Publicación en páginas de empresa</li>
              <li>• Tono editorial ajustado</li>
              <li>• Métricas B2B</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
