// hooks/useRealtimeLeads.ts
import { useEffect, useState } from 'react';

export function useRealtimeLeads<T>(
    fetchFunction: () => Promise<T>,
    intervalMs: number = 5000
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const result = await fetchFunction();
            // Simple check to prevent unnecessary re-renders if data hasn't changed
            if (JSON.stringify(result) !== JSON.stringify(data)) {
                setData(result);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();
        // Set up polling interval
        const intervalId = setInterval(fetchData, intervalMs);
        // Cleanup on unmount
        return () => clearInterval(intervalId);
    }, [fetchFunction, intervalMs]);

    return { data, loading, error, refetch: fetchData };
}