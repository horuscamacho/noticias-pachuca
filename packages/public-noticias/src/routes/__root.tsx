import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Noticias Pachuca',
      },
      {
        property: 'og:image',
        content: 'https://cdn.noticiaspachuca.com/logos/logo-transparent.png',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'Noticias Pachuca',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      // Favicons from CDN
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: 'https://cdn.noticiaspachuca.com/logos/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: 'https://cdn.noticiaspachuca.com/logos/favicon-16x16.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: 'https://cdn.noticiaspachuca.com/logos/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: 'https://cdn.noticiaspachuca.com/logos/favicon.ico',
      },
      // Android
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: 'https://cdn.noticiaspachuca.com/logos/android-chrome-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        href: 'https://cdn.noticiaspachuca.com/logos/android-chrome-512x512.png',
      },
    ],
    scripts: [
      // Plausible Analytics - Privacy-first, GDPR compliant, Custom Events enabled
      {
        defer: true,
        'data-domain': 'noticiaspachuca.com',
        src: 'https://plausible.io/js/script.tagged-events.js',
      },
    ],
  }),

  notFoundComponent: () => {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="bg-white border-4 border-black p-12 text-center max-w-2xl relative">
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>
          <h1 className="text-4xl font-black uppercase text-black mb-4">404</h1>
          <p className="text-xl font-bold uppercase text-[#854836] mb-6">PÁGINA NO ENCONTRADA</p>
          <a
            href="/"
            className="inline-block bg-black text-white px-8 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors"
          >
            VOLVER AL INICIO
          </a>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#854836] transform rotate-45"></div>
        </div>
      </div>
    )
  },

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanstackDevtools
          config={{
            position: 'bottom-left',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
