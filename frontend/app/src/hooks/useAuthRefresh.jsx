import { useEffect } from "react";
import { useMutationCustom } from "./apiHooks";
import { URLS_BACKEND, DELAY_REQUEST_REFRESH } from "../constants";

export function useAuthRefresh(ws) {
    const mutateRefresh = useMutationCustom(
        URLS_BACKEND.REFRESH,
        "POST",
        null,
        () => {
            ws.initWebSocket();
        },
        () => {
            ws.closeWebSocket();
        }
    );

    useEffect(() => {
        mutateRefresh.mutate();

        const interval = setInterval(() => {
            mutateRefresh.mutate();
        }, DELAY_REQUEST_REFRESH);

        return () => clearInterval(interval);
    }, [ws.refresh]);

    return mutateRefresh;
}
