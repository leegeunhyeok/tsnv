import type * as rolldown from 'rolldown';

export function getBindingErrors(reason: unknown): Error[] | undefined {
  if (reason instanceof Error) {
    return (reason as { errors?: Error[] }).errors;
  }
}

export function isRolldownLog(log: unknown): log is rolldown.RolldownLog {
  return log !== null && typeof log === 'object' && 'code' in log && 'plugin' in log;
}
