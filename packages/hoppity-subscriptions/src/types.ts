/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrokerAsPromised } from "rascal";

// Define types based on rascal's internal types
type Message = any; // Will be properly typed when rascal provides the message
type AckOrNack = (err?: Error, recovery?: any) => void;

/**
 * Handler function signature for subscription message processing.
 *
 * @param message - The Rascal message object
 * @param content - The parsed message content
 * @param ackOrNackFn - Function to acknowledge or nack the message
 * @param broker - The Rascal broker instance
 * @returns Promise<void> | void - Can be synchronous or asynchronous
 */
export type SubscriptionHandler = (
    message: Message,
    content: any,
    ackOrNackFn: AckOrNack,
    broker: BrokerAsPromised
) => Promise<void> | void;

/**
 * Handlers object mapping subscription names to their handler functions.
 * Each key should match a subscription name in the broker topology.
 */
export type SubscriptionHandlers = Record<string, SubscriptionHandler>;

/**
 * Validation result for subscription handlers.
 */
export interface ValidationResult {
    /** Whether validation passed */
    isValid: boolean;
    /** List of handler keys that don't have matching subscriptions */
    missingSubscriptions: string[];
    /** List of available subscription names in the topology */
    availableSubscriptions: string[];
    /** List of handler keys that are not functions */
    invalidHandlers: string[];
    /** Error message if validation failed */
    errorMessage?: string;
}
