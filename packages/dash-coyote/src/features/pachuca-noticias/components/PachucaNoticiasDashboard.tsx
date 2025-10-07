import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconFileText,
  IconWorld,
  IconShare,
  IconClock,
  IconSparkles,
} from '@tabler/icons-react';

import { ContenidosDisponiblesTab } from './tabs/ContenidosDisponiblesTab';
import { DirectorEditorialTab } from './tabs/DirectorEditorialTab';
import { PublicacionesTab } from './tabs/PublicacionesTab';
import { RedesSocialesTab } from './tabs/RedesSocialesTab';
import { PublicationQueueView } from './queue/PublicationQueueView';

/**
 * 📰 Dashboard Principal de Pachuca Noticias
 * Gestión completa de publicaciones en web y redes sociales
 */
export function PachucaNoticiasDashboard() {
  const [activeTab, setActiveTab] = useState('contenidos');

  const tabs = [
    {
      id: 'director-editorial',
      label: 'Director Editorial',
      icon: IconSparkles,
      component: DirectorEditorialTab,
      description: 'Crea artículos desde instrucciones libres con IA',
    },
    {
      id: 'contenidos',
      label: 'Contenidos Disponibles',
      icon: IconFileText,
      component: ContenidosDisponiblesTab,
      description: 'Contenidos generados listos para publicar',
    },
    {
      id: 'cola-publicacion',
      label: 'Cola de Publicación',
      icon: IconClock,
      component: PublicationQueueView,
      description: 'Gestión de cola inteligente de publicaciones',
    },
    {
      id: 'publicaciones',
      label: 'Publicaciones',
      icon: IconWorld,
      component: PublicacionesTab,
      description: 'Noticias publicadas en el sitio público',
    },
    {
      id: 'redes-sociales',
      label: 'Redes Sociales',
      icon: IconShare,
      component: RedesSocialesTab,
      description: 'Publicación en Facebook, Twitter, Instagram (Fase 2)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
