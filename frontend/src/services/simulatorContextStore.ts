import { SimulatorContextData } from '../types';

let currentContext: SimulatorContextData | null = null;
const listeners = new Set<(context: SimulatorContextData | null) => void>();

export function getSimulatorContext(): SimulatorContextData | null {
  return currentContext;
}

export function setSimulatorContext(context: SimulatorContextData): void {
  currentContext = { ...context };
  listeners.forEach((listener) => {
    try {
      listener(currentContext);
    } catch (err) {
      console.error('Error in simulator context listener:', err);
    }
  });
}

export function clearSimulatorContext(): void {
  currentContext = null;
  listeners.forEach((listener) => {
    try {
      listener(null);
    } catch (err) {
      console.error('Error in simulator context listener:', err);
    }
  });
}

export function subscribeSimulatorContext(
  listener: (context: SimulatorContextData | null) => void
): () => void {
  listeners.add(listener);
  // Immediate invocation with current value
  try {
    listener(currentContext);
  } catch (err) {
    console.error('Error in initial simulator context subscription:', err);
  }
  return () => {
    listeners.delete(listener);
  };
}
