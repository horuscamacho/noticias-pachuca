import * as Network from 'expo-network';

export interface NetworkInfo {
  connectionType: 'none' | 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  carrierName: string | null;
  isConnected: boolean;
  isWifiEnabled: boolean;
  isCellularEnabled: boolean;
}

export class NetworkInfoCollector {
  static async collect(): Promise<NetworkInfo> {
    try {
      const networkState = await Network.getNetworkStateAsync();

      return {
        connectionType: networkState.type === Network.NetworkStateType.WIFI
          ? 'wifi'
          : networkState.type === Network.NetworkStateType.CELLULAR
          ? 'cellular'
          : networkState.type === Network.NetworkStateType.ETHERNET
          ? 'ethernet'
          : networkState.type === Network.NetworkStateType.NONE
          ? 'none'
          : 'unknown',
        carrierName: null, // Expo doesn't provide carrier info directly
        isConnected: networkState.isConnected || false,
        isWifiEnabled: networkState.type === Network.NetworkStateType.WIFI,
        isCellularEnabled: networkState.type === Network.NetworkStateType.CELLULAR,
      };
    } catch (error) {
      console.warn('Error collecting network info:', error);
      return {
        connectionType: 'unknown',
        carrierName: null,
        isConnected: false,
        isWifiEnabled: false,
        isCellularEnabled: false,
      };
    }
  }
}