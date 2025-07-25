/**
 * EventEmitter - Simple event emitter implementation
 *
 * Provides event handling capabilities for library components
 */

import { utilsLogger } from './logger';

export default class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          utilsLogger.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Add one-time event listener
   */
  once(event: string, callback: Function): void {
    const onceCallback = (data: any) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    const callbacks = this.events.get(event);
    return callbacks ? callbacks.length : 0;
  }
}
