/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Manages correlation IDs for RPC requests and their associated promises
 * Handles timeouts, request cancellation, and cleanup
 */

type CorrelationManagerInstance = {
    addRequest(correlationId: string, timeout: number): Promise<any>;
    resolveRequest(correlationId: string, response: any): boolean;
    rejectRequest(correlationId: string, error: any): boolean;
    cancelRequest(correlationId: string): boolean;
    cleanup(): void;
};

let _instance: CorrelationManagerInstance | undefined;

export function createCorrelationManager(): CorrelationManagerInstance {
    if (!_instance) {
        const pendingRequests = new Map<
            string,
            {
                resolve: (value: any) => void;
                reject: (error: any) => void;
                timeout: NodeJS.Timeout;
                timestamp: number;
            }
        >();

        _instance = {
            /**
             * Adds a new pending request and returns a promise that will be resolved/rejected
             * when the response is received or the request times out
             *
             * @param correlationId - Unique identifier for the request
             * @param timeout - Timeout duration in milliseconds
             * @returns Promise that resolves with the response or rejects with an error
             */
            addRequest(correlationId: string, timeout: number): Promise<any> {
                return new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        pendingRequests.delete(correlationId);
                        reject(new Error(`RPC request timed out after ${timeout}ms`));
                    }, timeout);

                    pendingRequests.set(correlationId, {
                        resolve,
                        reject,
                        timeout: timeoutId,
                        timestamp: Date.now(),
                    });
                });
            },

            /**
             * Resolves a pending request with a successful response
             *
             * @param correlationId - The correlation ID of the request to resolve
             * @param response - The response payload
             * @returns True if the request was found and resolved, false otherwise
             */
            resolveRequest(correlationId: string, response: any): boolean {
                const request = pendingRequests.get(correlationId);
                if (!request) return false;

                clearTimeout(request.timeout);
                pendingRequests.delete(correlationId);
                request.resolve(response);
                return true;
            },

            /**
             * Rejects a pending request with an error
             *
             * @param correlationId - The correlation ID of the request to reject
             * @param error - The error to reject with
             * @returns True if the request was found and rejected, false otherwise
             */
            rejectRequest(correlationId: string, error: any): boolean {
                const request = pendingRequests.get(correlationId);
                if (!request) return false;

                clearTimeout(request.timeout);
                pendingRequests.delete(correlationId);
                request.reject(error);
                return true;
            },

            /**
             * Cancels a pending request
             *
             * @param correlationId - The correlation ID of the request to cancel
             * @returns True if the request was found and cancelled, false otherwise
             */
            cancelRequest(correlationId: string): boolean {
                const request = pendingRequests.get(correlationId);
                if (!request) return false;

                clearTimeout(request.timeout);
                pendingRequests.delete(correlationId);
                request.reject(new Error("RPC request cancelled"));
                return true;
            },

            /**
             * Cleans up all pending requests (useful during shutdown)
             * All pending requests will be rejected with a cleanup error
             */
            cleanup(): void {
                for (const [_correlationId, request] of pendingRequests) {
                    clearTimeout(request.timeout);
                    request.reject(new Error("RPC manager cleanup"));
                }
                pendingRequests.clear();
            },
        };
    }

    return _instance;
}
