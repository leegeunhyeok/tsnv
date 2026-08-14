import { greeting } from '../greeting';
import type { GreetingOptions } from '../types';

export function formatGreeting(options: GreetingOptions): string {
  return `${options.prefix}: ${greeting()}`;
}
