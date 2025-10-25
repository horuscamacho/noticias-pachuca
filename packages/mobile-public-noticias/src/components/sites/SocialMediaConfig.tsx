import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGetLateFacebookPages, useGetLateTwitterAccounts } from '@/src/hooks/useSocialMedia';
import type { SocialMedia, FacebookPage, TwitterAccount } from '@/src/types/site.types';
import type { GetLateFacebookPage, GetLateTwitterAccount } from '@/src/services/social-media/socialMediaApi';

export interface SocialMediaConfigProps {
  data: SocialMedia;
  onChange: (data: SocialMedia) => void;
}

/**
 * 📱 FASE 13: Componente para configurar redes sociales de un Site
 * Permite agregar/editar páginas de Facebook y cuentas de Twitter desde GetLate.dev
 */
export function SocialMediaConfig({ data, onChange }: SocialMediaConfigProps) {
  const [showAddFacebook, setShowAddFacebook] = useState(false);
  const [showAddTwitter, setShowAddTwitter] = useState(false);

  // Prioridad para nueva página/cuenta
  const [fbPriority, setFbPriority] = useState('1');
  const [twPriority, setTwPriority] = useState('1');

  // Obtener páginas y cuentas de GetLate
  const { data: facebookPagesData, isLoading: fbLoading, error: fbError } = useGetLateFacebookPages();
  const { data: twitterAccountsData, isLoading: twLoading, error: twError } = useGetLateTwitterAccounts();

  // ========================================
  // FACEBOOK HANDLERS
  // ========================================

  const handleSelectFacebookPage = (page: GetLateFacebookPage) => {
    // Verificar si ya está agregada
    const alreadyAdded = data.facebookPages?.some((p) => p.pageId === page.id);
    if (alreadyAdded) {
      Alert.alert('Ya agregada', 'Esta página ya está vinculada a este sitio');
      return;
    }

    const newPage: FacebookPage = {
      pageId: page.id,
      pageName: page.name,
      isActive: true,
      priority: parseInt(fbPriority) || 1,
    };

    onChange({
      ...data,
      facebookPages: [...(data.facebookPages || []), newPage],
    });

    // Reset
    setFbPriority('1');
    setShowAddFacebook(false);
  };

  const handleToggleFacebookPage = (pageId: string) => {
    const updatedPages = data.facebookPages?.map((page) =>
      page.pageId === pageId ? { ...page, isActive: !page.isActive } : page
    );
    onChange({ ...data, facebookPages: updatedPages });
  };

  const handleRemoveFacebookPage = (pageId: string) => {
    Alert.alert(
      'Confirmar',
      '¿Eliminar esta página de Facebook?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedPages = data.facebookPages?.filter((page) => page.pageId !== pageId);
            onChange({ ...data, facebookPages: updatedPages });
          },
        },
      ]
    );
  };

  // ========================================
  // TWITTER HANDLERS
  // ========================================

  const handleSelectTwitterAccount = (account: GetLateTwitterAccount) => {
    // Verificar si ya está agregada
    const alreadyAdded = data.twitterAccounts?.some((a) => a.accountId === account.id);
    if (alreadyAdded) {
      Alert.alert('Ya agregada', 'Esta cuenta ya está vinculada a este sitio');
      return;
    }

    const newAccount: TwitterAccount = {
      accountId: account.id,
      username: account.username,
      displayName: account.displayName,
      isActive: true,
      priority: parseInt(twPriority) || 1,
    };

    onChange({
      ...data,
      twitterAccounts: [...(data.twitterAccounts || []), newAccount],
    });

    // Reset
    setTwPriority('1');
    setShowAddTwitter(false);
  };

  const handleToggleTwitterAccount = (accountId: string) => {
    const updatedAccounts = data.twitterAccounts?.map((account) =>
      account.accountId === accountId ? { ...account, isActive: !account.isActive } : account
    );
    onChange({ ...data, twitterAccounts: updatedAccounts });
  };

  const handleRemoveTwitterAccount = (accountId: string) => {
    Alert.alert(
      'Confirmar',
      '¿Eliminar esta cuenta de Twitter?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedAccounts = data.twitterAccounts?.filter(
              (account) => account.accountId !== accountId
            );
            onChange({ ...data, twitterAccounts: updatedAccounts });
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* ========================================
          FACEBOOK PAGES
      ======================================== */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-medium">📘 Páginas de Facebook</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          {/* Lista de páginas */}
          {data.facebookPages && data.facebookPages.length > 0 ? (
            <View className="gap-3">
              {data.facebookPages.map((page) => (
                <View
                  key={page.pageId}
                  className="bg-secondary rounded-lg p-4 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <ThemedText variant="body-medium" className="font-semibold">
                      {page.pageName}
                    </ThemedText>
                    <ThemedText variant="label-small" color="secondary" className="mt-1">
                      ID: {page.pageId} • Prioridad: {page.priority}
                    </ThemedText>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Switch
                      checked={page.isActive}
                      onCheckedChange={() => handleToggleFacebookPage(page.pageId)}
                    />
                    <Pressable
                      onPress={() => handleRemoveFacebookPage(page.pageId)}
                      className="p-2"
                    >
                      <ThemedText variant="label-medium" className="text-destructive">
                        🗑️
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-muted rounded-lg p-6 items-center">
              <ThemedText variant="body-small" color="secondary" className="text-center">
                No hay páginas de Facebook configuradas
              </ThemedText>
            </View>
          )}

          <Separator />

          {/* Selector de páginas de GetLate */}
          {showAddFacebook ? (
            <View className="gap-4 bg-card border border-border rounded-lg p-4">
              <View className="flex-row items-center justify-between">
                <ThemedText variant="label-medium" className="font-semibold">
                  Seleccionar Página de Facebook
                </ThemedText>
                <Pressable onPress={() => setShowAddFacebook(false)}>
                  <ThemedText variant="label-medium" className="text-muted-foreground">
                    ✕
                  </ThemedText>
                </Pressable>
              </View>

              <ThemedText variant="body-small" color="secondary">
                Conectadas en GetLate.dev
              </ThemedText>

              {/* Loading state */}
              {fbLoading && (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <ThemedText variant="body-small" color="secondary" className="mt-2">
                    Cargando páginas...
                  </ThemedText>
                </View>
              )}

              {/* Error state */}
              {fbError && (
                <View className="bg-destructive/10 rounded-lg p-4">
                  <ThemedText variant="body-small" className="text-destructive">
                    Error al cargar páginas de GetLate. Verifica tu API Key.
                  </ThemedText>
                </View>
              )}

              {/* Lista de páginas */}
              {!fbLoading && !fbError && facebookPagesData && (
                <>
                  {facebookPagesData.pages.length === 0 ? (
                    <View className="bg-muted rounded-lg p-6 items-center">
                      <ThemedText variant="body-small" color="secondary" className="text-center">
                        No hay páginas disponibles en GetLate.dev
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      <View className="gap-2 max-h-72">
                        <ScrollView showsVerticalScrollIndicator={true}>
                          {facebookPagesData.pages.map((page) => {
                            const isAdded = data.facebookPages?.some((p) => p.pageId === page.id);
                            return (
                              <Pressable
                                key={page.id}
                                onPress={() => !isAdded && handleSelectFacebookPage(page)}
                                disabled={isAdded}
                                className={`border rounded-lg p-3 mb-2 ${
                                  isAdded ? 'bg-muted border-muted' : 'bg-card border-border active:bg-accent'
                                }`}
                              >
                                <View className="flex-row items-center justify-between">
                                  <View className="flex-1">
                                    <ThemedText variant="body-medium" className="font-semibold">
                                      {page.name}
                                      {page.isVerified && ' ✓'}
                                    </ThemedText>
                                    <ThemedText variant="label-small" color="secondary">
                                      ID: {page.id}
                                      {page.followerCount && ` • ${page.followerCount.toLocaleString()} seguidores`}
                                    </ThemedText>
                                  </View>
                                  {isAdded && (
                                    <Badge variant="secondary">
                                      <ThemedText variant="label-small">Agregada</ThemedText>
                                    </Badge>
                                  )}
                                </View>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>

                      <View className="gap-2">
                        <Label>Prioridad (orden de publicación)</Label>
                        <Input
                          value={fbPriority}
                          onChangeText={setFbPriority}
                          placeholder="1"
                          keyboardType="numeric"
                        />
                      </View>
                    </>
                  )}
                </>
              )}
            </View>
          ) : (
            <Button variant="outline" onPress={() => setShowAddFacebook(true)}>
              <ThemedText>+ Vincular Página de Facebook</ThemedText>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ========================================
          TWITTER ACCOUNTS
      ======================================== */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-medium">🐦 Cuentas de Twitter</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          {/* Lista de cuentas */}
          {data.twitterAccounts && data.twitterAccounts.length > 0 ? (
            <View className="gap-3">
              {data.twitterAccounts.map((account) => (
                <View
                  key={account.accountId}
                  className="bg-secondary rounded-lg p-4 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <ThemedText variant="body-medium" className="font-semibold">
                      {account.displayName}
                    </ThemedText>
                    <ThemedText variant="label-small" color="secondary" className="mt-1">
                      @{account.username} • Prioridad: {account.priority}
                    </ThemedText>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Switch
                      checked={account.isActive}
                      onCheckedChange={() => handleToggleTwitterAccount(account.accountId)}
                    />
                    <Pressable
                      onPress={() => handleRemoveTwitterAccount(account.accountId)}
                      className="p-2"
                    >
                      <ThemedText variant="label-medium" className="text-destructive">
                        🗑️
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-muted rounded-lg p-6 items-center">
              <ThemedText variant="body-small" color="secondary" className="text-center">
                No hay cuentas de Twitter configuradas
              </ThemedText>
            </View>
          )}

          <Separator />

          {/* Selector de cuentas de GetLate */}
          {showAddTwitter ? (
            <View className="gap-4 bg-card border border-border rounded-lg p-4">
              <View className="flex-row items-center justify-between">
                <ThemedText variant="label-medium" className="font-semibold">
                  Seleccionar Cuenta de Twitter
                </ThemedText>
                <Pressable onPress={() => setShowAddTwitter(false)}>
                  <ThemedText variant="label-medium" className="text-muted-foreground">
                    ✕
                  </ThemedText>
                </Pressable>
              </View>

              <ThemedText variant="body-small" color="secondary">
                Conectadas en GetLate.dev
              </ThemedText>

              {/* Loading state */}
              {twLoading && (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#0EA5E9" />
                  <ThemedText variant="body-small" color="secondary" className="mt-2">
                    Cargando cuentas...
                  </ThemedText>
                </View>
              )}

              {/* Error state */}
              {twError && (
                <View className="bg-destructive/10 rounded-lg p-4">
                  <ThemedText variant="body-small" className="text-destructive">
                    Error al cargar cuentas de GetLate. Verifica tu API Key.
                  </ThemedText>
                </View>
              )}

              {/* Lista de cuentas */}
              {!twLoading && !twError && twitterAccountsData && (
                <>
                  {twitterAccountsData.accounts.length === 0 ? (
                    <View className="bg-muted rounded-lg p-6 items-center">
                      <ThemedText variant="body-small" color="secondary" className="text-center">
                        No hay cuentas disponibles en GetLate.dev
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      <View className="gap-2 max-h-72">
                        <ScrollView showsVerticalScrollIndicator={true}>
                          {twitterAccountsData.accounts.map((account) => {
                            const isAdded = data.twitterAccounts?.some((a) => a.accountId === account.id);
                            return (
                              <Pressable
                                key={account.id}
                                onPress={() => !isAdded && handleSelectTwitterAccount(account)}
                                disabled={isAdded}
                                className={`border rounded-lg p-3 mb-2 ${
                                  isAdded ? 'bg-muted border-muted' : 'bg-card border-border active:bg-accent'
                                }`}
                              >
                                <View className="flex-row items-center justify-between">
                                  <View className="flex-1">
                                    <ThemedText variant="body-medium" className="font-semibold">
                                      {account.displayName}
                                      {account.isVerified && ' ✓'}
                                    </ThemedText>
                                    <ThemedText variant="label-small" color="secondary">
                                      @{account.username}
                                      {account.followerCount && ` • ${account.followerCount.toLocaleString()} seguidores`}
                                    </ThemedText>
                                  </View>
                                  {isAdded && (
                                    <Badge variant="secondary">
                                      <ThemedText variant="label-small">Agregada</ThemedText>
                                    </Badge>
                                  )}
                                </View>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>

                      <View className="gap-2">
                        <Label>Prioridad (orden de publicación)</Label>
                        <Input
                          value={twPriority}
                          onChangeText={setTwPriority}
                          placeholder="1"
                          keyboardType="numeric"
                        />
                      </View>
                    </>
                  )}
                </>
              )}
            </View>
          ) : (
            <Button variant="outline" onPress={() => setShowAddTwitter(true)}>
              <ThemedText>+ Vincular Cuenta de Twitter</ThemedText>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ========================================
          GETLATE API KEY (OPCIONAL)
      ======================================== */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-medium">🔑 GetLate API Key (Opcional)</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <ThemedText variant="body-small" color="secondary">
            Si no se especifica, se usará la API key global del sistema
          </ThemedText>
          <Input
            value={data.getLateApiKey || ''}
            onChangeText={(text) => onChange({ ...data, getLateApiKey: text })}
            placeholder="Dejar vacío para usar API key global"
            secureTextEntry
          />
        </CardContent>
      </Card>
    </ScrollView>
  );
}
