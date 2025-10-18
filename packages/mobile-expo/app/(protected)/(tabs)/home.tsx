import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Pressable, FlatList, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useAuth } from '@/src/hooks/useAuth';
import { useResponsive } from '@/src/features/responsive';
import { useContentAgents } from '@/src/hooks/useContentAgents';
import { useSites, useSiteStats } from '@/src/hooks/useSites';
import { useCommunityManagerStats } from '@/src/hooks/useCommunityManager';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/src/components/stats/StatsCard';
import { Globe, Plus, Settings, FileText, TrendingUp, ExternalLink, Sparkles, Bot, PlusCircle } from 'lucide-react-native';

const AGENT_TYPE_EMOJI: Record<string, string> = {
  reportero: '📰',
  columnista: '✍️',
  trascendido: '🔍',
  'seo-specialist': '🎯'
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { isTablet } = useResponsive();
  const router = useRouter();

  // Obtener agentes activos
  const { data: agents, isLoading: isLoadingAgents } = useContentAgents({ isActive: true });

  // Obtener sites y estadísticas
  const { data: sitesData, isLoading: isLoadingSites } = useSites({ isActive: true, limit: 10 });
  const { data: stats, isLoading: isLoadingStats } = useSiteStats();

  // Obtener estadísticas del Community Manager
  const { data: cmStats, isLoading: isLoadingCM } = useCommunityManagerStats();

  const agentsToShow = agents?.slice(0, 5) || [];
  const sitesToShow = sitesData?.sites?.slice(0, 5) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            isTablet && styles.contentTablet
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Personalizado */}
          <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText variant="headline-medium" style={styles.welcomeTitle}>
                Hola, {user?.username || 'Usuario'} 👋
              </ThemedText>
              <ThemedText variant="body-medium" color="secondary" style={styles.dateText}>
                {new Date().toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </ThemedText>
            </View>

            <Pressable style={styles.avatarButton}>
              <View style={styles.avatar}>
                <ThemedText variant="title-medium" style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Stats Grid */}
        {stats && !isLoadingStats && (
          <View style={styles.statsGrid}>
            <StatsCard
              icon="🤖"
              title="Agentes"
              value={stats.totalAgents}
              subtitle="activos"
              variant="primary"
            />
            <StatsCard
              icon="🌐"
              title="Sitios"
              value={stats.totalSites}
              subtitle="configurados"
              variant="default"
            />
            <StatsCard
              icon="📰"
              title="Noticias"
              value={stats.totalNoticias}
              subtitle="publicadas"
              variant="default"
            />
            <StatsCard
              icon="📊"
              title="Outlets"
              value={stats.totalOutlets}
              subtitle="monitoreados"
              variant="secondary"
            />
          </View>
        )}

        {/* Acciones Rápidas */}
        <Card style={styles.quickActionsCard}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">Acciones Rápidas</ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.quickActionsGrid}>
              <Pressable
                style={styles.quickAction}
                onPress={() => router.push('/agents/create')}
              >
                <View style={styles.quickActionIcon}>
                  <Bot size={32} color="#9333ea" />
                </View>
                <ThemedText variant="label-medium" style={styles.quickActionText}>
                  Nuevo Agente
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.quickAction}
                onPress={() => router.push('/sites/create')}
              >
                <View style={styles.quickActionIcon}>
                  <PlusCircle size={32} color="#22c55e" />
                </View>
                <ThemedText variant="label-medium" style={styles.quickActionText}>
                  Nuevo Sitio
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.quickAction}
                onPress={() => router.push('/generate')}
              >
                <View style={styles.quickActionIcon}>
                  <Sparkles size={32} color="#f59e0b" />
                </View>
                <ThemedText variant="label-medium" style={styles.quickActionText}>
                  Generar Contenido
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.quickAction}
                onPress={() => router.push('/extract')}
              >
                <View style={styles.quickActionIcon}>
                  <TrendingUp size={32} color="#3b82f6" />
                </View>
                <ThemedText variant="label-medium" style={styles.quickActionText}>
                  Extraer URLs
                </ThemedText>
              </Pressable>
            </View>
          </CardContent>
        </Card>

        {/* Community Manager Section */}
        {cmStats && !isLoadingCM && (
          <Card style={styles.communityManagerCard}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">📅 Community Manager</ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Stats Grid */}
              <View style={styles.cmStatsGrid}>
                <View style={[styles.cmStatBox, styles.cmStatBoxBlue]}>
                  <ThemedText variant="label-small" style={styles.cmStatLabel}>
                    Programados
                  </ThemedText>
                  <ThemedText variant="title-large" style={styles.cmStatValueBlue}>
                    {cmStats.scheduledPosts.total}
                  </ThemedText>
                </View>
                <View style={[styles.cmStatBox, styles.cmStatBoxGreen]}>
                  <ThemedText variant="label-small" style={styles.cmStatLabel}>
                    Reciclados
                  </ThemedText>
                  <ThemedText variant="title-large" style={styles.cmStatValueGreen}>
                    {cmStats.recycling.totalRecycled}
                  </ThemedText>
                </View>
                <View style={[styles.cmStatBox, styles.cmStatBoxYellow]}>
                  <ThemedText variant="label-small" style={styles.cmStatLabel}>
                    Elegibles
                  </ThemedText>
                  <ThemedText variant="title-large" style={styles.cmStatValueYellow}>
                    {cmStats.recycling.totalEligible}
                  </ThemedText>
                </View>
              </View>

              {/* Quick Links */}
              <View style={styles.cmQuickLinks}>
                <Pressable
                  style={styles.cmQuickLink}
                  onPress={() => router.push('/community-manager/schedule')}
                >
                  <ThemedText variant="label-small" style={styles.cmQuickLinkText}>
                    📅 Calendario
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={styles.cmQuickLink}
                  onPress={() => router.push('/community-manager/recycling')}
                >
                  <ThemedText variant="label-small" style={styles.cmQuickLinkText}>
                    ♻️ Reciclaje
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={styles.cmQuickLink}
                  onPress={() => router.push('/community-manager/analytics')}
                >
                  <ThemedText variant="label-small" style={styles.cmQuickLinkText}>
                    📊 Analytics
                  </ThemedText>
                </Pressable>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Sección de Agentes Disponibles */}
        <Card style={styles.agentsSection}>
          <CardHeader>
            <View style={styles.sectionHeader}>
              <CardTitle>
                <ThemedText variant="title-medium">Agentes Disponibles</ThemedText>
              </CardTitle>
              <Pressable
                style={styles.addButton}
                onPress={() => router.push('/agents/create')}
              >
                <ThemedText variant="label-medium" style={styles.addButtonText}>+</ThemedText>
              </Pressable>
            </View>
          </CardHeader>
          <CardContent>
            {isLoadingAgents ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#f1ef47" />
                <ThemedText variant="body-small" color="secondary" style={{ marginTop: 8 }}>
                  Cargando agentes...
                </ThemedText>
              </View>
            ) : agentsToShow.length > 0 ? (
              <FlatList
                horizontal
                data={agentsToShow}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.agentItem}
                    onPress={() => router.push(`/agents/${item.id}/edit`)}
                  >
                    <View style={styles.agentIconContainer}>
                      <ThemedText variant="title-large" style={styles.agentIcon}>
                        {AGENT_TYPE_EMOJI[item.agentType] || '🤖'}
                      </ThemedText>
                    </View>
                    <ThemedText variant="label-small" style={styles.agentName} numberOfLines={2}>
                      {item.name}
                    </ThemedText>
                    <Badge variant="secondary" style={styles.agentBadge}>
                      <ThemedText variant="label-small">
                        {item.editorialLean}
                      </ThemedText>
                    </Badge>
                  </Pressable>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.agentsList}
              />
            ) : (
              <View style={styles.emptyState}>
                <ThemedText variant="body-medium" color="secondary" style={{ textAlign: 'center' }}>
                  No hay agentes activos
                </ThemedText>
                <ThemedText variant="body-small" color="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
                  Presiona "+" para crear tu primer agente
                </ThemedText>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Sección de Sites Disponibles - REDISEÑADA SIGUIENDO OUTLETCARD */}
        <View style={styles.sitesSection}>
          <View style={styles.sitesSectionHeader}>
            <ThemedText variant="title-medium" style={styles.sitesSectionTitle}>
              Sitios Disponibles
            </ThemedText>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/sites/create')}
            >
              <ThemedText variant="label-medium" style={styles.addButtonText}>+</ThemedText>
            </Pressable>
          </View>

          {isLoadingSites ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#f1ef47" />
              <ThemedText variant="body-small" color="secondary" style={{ marginTop: 8 }}>
                Cargando sites...
              </ThemedText>
            </View>
          ) : sitesToShow.length > 0 ? (
            sitesToShow.map((site) => (
              <Card key={site.id} style={styles.siteCard}>
                {/* Header: Título, Domain, Badge de estado */}
                <CardHeader>
                  <View style={styles.siteCardHeader}>
                    <View style={styles.siteHeaderLeft}>
                      <View style={styles.siteTitleRow}>
                        <Text style={styles.siteCardTitle}>{site.name}</Text>
                        {site.isMainSite && (
                          <Badge style={styles.mainBadge}>
                            <Text style={styles.mainBadgeText}>MAIN</Text>
                          </Badge>
                        )}
                      </View>
                      <View style={styles.siteDomainRow}>
                        <ExternalLink size={12} color="#6B7280" />
                        <Text style={styles.siteDomain}>{site.domain}</Text>
                      </View>
                    </View>
                    <Badge variant={site.isActive ? 'default' : 'secondary'}>
                      <Text style={styles.statusBadgeText}>
                        {site.isActive ? 'Activo' : 'Inactivo'}
                      </Text>
                    </Badge>
                  </View>
                </CardHeader>

                {/* Content: Grid de estadísticas con colores */}
                <CardContent>
                  {/* Primera fila: Noticias y Views */}
                  <View style={styles.statsRow}>
                    <View style={[styles.statBox, styles.statBoxBlue]}>
                      <View style={styles.statBoxHeader}>
                        <FileText size={14} color="#3b82f6" />
                        <Text style={styles.statBoxLabel}>Noticias</Text>
                      </View>
                      <Text style={styles.statBoxValueBlue}>
                        {site.totalNoticias ?? 0}
                      </Text>
                    </View>

                    <View style={[styles.statBox, styles.statBoxGreen]}>
                      <View style={styles.statBoxHeader}>
                        <TrendingUp size={14} color="#22c55e" />
                        <Text style={styles.statBoxLabel}>Views</Text>
                      </View>
                      <Text style={styles.statBoxValueGreen}>
                        {site.totalViews ?? 0}
                      </Text>
                    </View>
                  </View>

                  {/* Segunda fila: Social Posts */}
                  {site.totalSocialPosts !== undefined && (
                    <View style={styles.statsRow}>
                      <View style={[styles.statBox, styles.statBoxYellow, { flex: 1 }]}>
                        <View style={styles.statBoxHeader}>
                          <Sparkles size={14} color="#000" />
                          <Text style={[styles.statBoxLabel, { color: '#000' }]}>Social Posts</Text>
                        </View>
                        <Text style={styles.statBoxValueYellow}>
                          {site.totalSocialPosts}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Descripción */}
                  {site.description && (
                    <View style={styles.siteDescription}>
                      <Text style={styles.siteDescriptionText} numberOfLines={2}>
                        {site.description}
                      </Text>
                    </View>
                  )}
                </CardContent>

                {/* Footer: Botones de acción */}
                <CardFooter style={styles.siteCardFooter}>
                  <Button variant="outline" style={styles.siteActionButton}>
                    <Text style={styles.siteActionButtonText}>Ver Detalles</Text>
                  </Button>

                  <TouchableOpacity
                    style={styles.siteActionButtonPrimary}
                    onPress={() => router.push(`/sites/${site.id}/edit`)}
                  >
                    <Settings size={16} color="#000" />
                    <Text style={styles.siteActionButtonPrimaryText}>Configurar</Text>
                  </TouchableOpacity>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyStateCard}>
              <CardContent style={styles.emptyStateContent}>
                <Globe size={64} color="#9CA3AF" />
                <ThemedText variant="title-medium" style={styles.emptyStateTitle}>
                  No hay sites configurados
                </ThemedText>
                <ThemedText variant="body-medium" color="secondary" style={styles.emptyStateText}>
                  Crea tu primer sitio para comenzar a publicar noticias
                </ThemedText>
                <Button
                  style={styles.emptyStateButton}
                  onPress={() => router.push('/sites/create')}
                >
                  <Plus size={20} color="#000" strokeWidth={2.5} />
                  <ThemedText style={styles.emptyStateButtonText}>
                    Crear Primer Sitio
                  </ThemedText>
                </Button>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 24,
    paddingBottom: 40
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%'
  },
  header: {
    marginBottom: 24
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  welcomeTitle: {
    color: '#111827',
    marginBottom: 4
  },
  dateText: {
    color: '#6B7280',
    textTransform: 'capitalize'
  },
  avatarButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1ef47',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#000',
    fontWeight: '700'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  },
  quickActionsCard: {
    marginBottom: 24
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  quickAction: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  quickActionText: {
    textAlign: 'center'
  },
  agentsSection: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1ef47',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 28
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32
  },
  agentsList: {
    paddingVertical: 8
  },
  agentItem: {
    width: 100,
    marginRight: 16,
    alignItems: 'center'
  },
  agentIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  agentIcon: {
    fontSize: 32
  },
  agentName: {
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 32
  },
  agentBadge: {
    alignSelf: 'center'
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  // Estilos para Sites Section - REDISEÑADA
  sitesSection: {
    marginBottom: 24
  },
  sitesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4
  },
  sitesSectionTitle: {
    color: '#111827'
  },
  siteCard: {
    marginBottom: 16
  },
  siteCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  siteHeaderLeft: {
    flex: 1,
    paddingRight: 8
  },
  siteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  siteCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  mainBadge: {
    backgroundColor: '#f1ef47',
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000'
  },
  siteDomainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  siteDomain: {
    fontSize: 12,
    color: '#6B7280'
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8
  },
  statBoxBlue: {
    backgroundColor: '#EFF6FF'
  },
  statBoxGreen: {
    backgroundColor: '#F0FDF4'
  },
  statBoxYellow: {
    backgroundColor: '#f1ef47'
  },
  statBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#6B7280'
  },
  statBoxValueBlue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af'
  },
  statBoxValueGreen: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803d'
  },
  statBoxValueYellow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000'
  },
  siteDescription: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  siteDescriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20
  },
  siteCardFooter: {
    gap: 8
  },
  siteActionButton: {
    flex: 1
  },
  siteActionButtonText: {
    fontWeight: '600'
  },
  siteActionButtonPrimary: {
    flex: 1,
    backgroundColor: '#f1ef47',
    minHeight: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  siteActionButtonPrimaryText: {
    color: '#000',
    fontWeight: '600'
  },
  emptyStateCard: {
    marginTop: 8
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyStateTitle: {
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: 24
  },
  emptyStateButton: {
    backgroundColor: '#f1ef47',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  emptyStateButtonText: {
    color: '#000',
    fontWeight: '600'
  },
  // Community Manager Styles
  communityManagerCard: {
    marginBottom: 24
  },
  cmStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  cmStatBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cmStatBoxBlue: {
    backgroundColor: '#EFF6FF'
  },
  cmStatBoxGreen: {
    backgroundColor: '#F0FDF4'
  },
  cmStatBoxYellow: {
    backgroundColor: '#FEF3C7'
  },
  cmStatLabel: {
    color: '#6B7280',
    marginBottom: 4
  },
  cmStatValueBlue: {
    color: '#1e40af',
    fontWeight: '700'
  },
  cmStatValueGreen: {
    color: '#15803d',
    fontWeight: '700'
  },
  cmStatValueYellow: {
    color: '#b45309',
    fontWeight: '700'
  },
  cmQuickLinks: {
    flexDirection: 'row',
    gap: 8
  },
  cmQuickLink: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center'
  },
  cmQuickLinkText: {
    color: '#111827',
    textAlign: 'center'
  }
});
