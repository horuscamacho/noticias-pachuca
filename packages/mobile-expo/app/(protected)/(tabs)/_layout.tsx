import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS } from "react-native";

export default function TabsLayout() {
  return (
    <NativeTabs
      labelStyle={{
        // Color del texto del tab
        color: DynamicColorIOS({
          dark: "#f1ef47", // Amarillo Coyote en modo oscuro
          light: "#000000", // Negro en modo claro
        }),
        // Color del ícono seleccionado y la "gota" (bubble)
        tintColor: DynamicColorIOS({
          dark: "#f1ef47", // Amarillo Coyote en modo oscuro
          light: "#f1ef47", // Amarillo Coyote en modo claro
        }),
      }}
    >
      <NativeTabs.Trigger name="home">
        <Label>Inicio</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="extract">
        <Label>Sitios</Label>
        <Icon sf="doc.text.magnifyingglass" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="generate">
        <Label>Contenidos</Label>
        <Icon sf="sparkles" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="generados">
        <Label>Generados</Label>
        <Icon sf="doc.text" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="images">
        <Label>Imágenes</Label>
        <Icon sf="photo.stack" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <Label>Stats</Label>
        <Icon sf="chart.bar" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
