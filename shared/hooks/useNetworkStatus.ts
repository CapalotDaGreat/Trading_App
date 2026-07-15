import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoState['type'] | 'unknown';
  isWifi: boolean;
  isCellular: boolean;
}

const DEFAULT_STATUS: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  type: 'unknown' as const,
  isWifi: false,
  isCellular: false,
};

function mapNetInfoState(state: NetInfoState): NetworkStatus {
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
    isWifi: state.type === 'wifi',
    isCellular: state.type === 'cellular',
  };
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(DEFAULT_STATUS);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus(mapNetInfoState(state));
    });

    NetInfo.fetch().then((state) => setStatus(mapNetInfoState(state)));

    return unsubscribe;
  }, []);

  return status;
}
