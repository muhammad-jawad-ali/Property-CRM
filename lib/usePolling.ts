import { useEffect, useState } from 'react';

export function usePolling<T>(fetchFn: () => Promise<T>, intervalMs = 5000) {
    const [data, setData] = useState<T | null>(null);
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const load = async () => {
            const result = await fetchFn();
            setData(result);
        };
        load();
        interval = setInterval(load, intervalMs);
        return () => clearInterval(interval);
    }, [fetchFn, intervalMs]);
    return data;
}