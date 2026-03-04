import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook that monitors internet connectivity in real-time.
 * Returns `isConnected` (true/false/null while loading) and a `refresh` function.
 */
export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected && state.isInternetReachable);
        });
        return () => unsubscribe();
    }, []);

    const refresh = async () => {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected && state.isInternetReachable);
    };

    return { isConnected, refresh };
}
