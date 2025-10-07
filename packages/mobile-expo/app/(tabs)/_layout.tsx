import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Label>Inicio</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="extract">
        <Label>Extraer</Label>
        <Icon sf="doc.text.magnifyingglass" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="generate">
        <Label>Generar</Label>
        <Icon sf="sparkles" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="publish">
        <Label>Publicar</Label>
        <Icon sf="arrow.up.doc" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <Label>Stats</Label>
        <Icon sf="chart.bar" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
