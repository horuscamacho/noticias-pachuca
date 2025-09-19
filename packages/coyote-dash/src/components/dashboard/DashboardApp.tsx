// 🎯 Dashboard Principal - Single Island con todos los componentes
import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  BarChart3,
  Users,
  Smartphone,
  Globe,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  Home,
  FolderOpen,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { $authState } from '@/stores/auth';
import { auth } from '@/lib/auth/utils';

// 📊 Mock data para MIS aplicaciones y clientes
const mockData = {
  stats: [
    {
      title: "Apps Activas",
      value: "12",
      change: +8.2,
      description: "Aplicaciones en producción",
      icon: Smartphone,
    },
    {
      title: "Clientes Totales",
      value: "47",
      change: +12.5,
      description: "Clientes satisfechos",
      icon: Users,
    },
    {
      title: "Visitas Mensuales",
      value: "89.5K",
      change: -2.1,
      description: "Tráfico total de apps",
      icon: Globe,
    },
    {
      title: "Revenue",
      value: "$24,680",
      change: +15.3,
      description: "Ingresos este mes",
      icon: TrendingUp,
    },
  ],
  recentApps: [
    { name: "Coyote News", client: "Pachuca Media", status: "live", users: "2.3K" },
    { name: "Analytics Dashboard", client: "Tech Corp", status: "development", users: "1.1K" },
    { name: "E-commerce Mobile", client: "Retail Plus", status: "live", users: "5.7K" },
    { name: "CRM System", client: "Sales Pro", status: "testing", users: "890" },
  ],
  sidebarItems: [
    { name: "Dashboard", icon: Home, active: true },
    { name: "Mis Apps", icon: Smartphone, count: 12 },
    { name: "Clientes", icon: Users, count: 47 },
    { name: "Proyectos", icon: FolderOpen, count: 8 },
    { name: "Analytics", icon: BarChart3 },
    { name: "Actividad", icon: Activity },
  ]
};

export function DashboardApp() {
  const authState = useStore($authState);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card/50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary">Coyote Apps</h1>
          <p className="text-sm text-muted-foreground">Panel de Control</p>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {mockData.sidebarItems.map((item) => (
              <Button
                key={item.name}
                variant={item.active ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedTab(item.name.toLowerCase())}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
                {item.count && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.count}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {authState.user?.firstName?.charAt(0) || 'C'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {authState.user?.firstName || 'Coyotito'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {authState.user?.email || 'coyotito@apps.com'}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-1" />
              Config
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-6">
            <h2 className="text-lg font-semibold">Panel de Mis Aplicaciones</h2>
            <div className="ml-auto">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Reportes
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {mockData.stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>{stat.title}</CardDescription>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span className={`inline-flex items-center ${
                      stat.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {stat.change > 0 ? '+' : ''}{stat.change}%
                    </span>
                    <span>{stat.description}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Apps Table */}
          <Card>
            <CardHeader>
              <CardTitle>Aplicaciones Recientes</CardTitle>
              <CardDescription>
                Estado actual de tus aplicaciones en desarrollo y producción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.recentApps.map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-muted-foreground">Cliente: {app.client}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge
                        variant={
                          app.status === 'live' ? 'default' :
                          app.status === 'development' ? 'secondary' : 'outline'
                        }
                      >
                        {app.status === 'live' ? '🟢 En Vivo' :
                         app.status === 'development' ? '🔄 Desarrollo' : '🧪 Testing'}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">{app.users}</p>
                        <p className="text-xs text-muted-foreground">usuarios</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}