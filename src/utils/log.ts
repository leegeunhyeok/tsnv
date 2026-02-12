import pc from 'picocolors';

import type { Format } from '../types';

export function withBoundary(title: string, text: string) {
  const messages = [
    `╭─ ${title}`,
    ...text.split('\n').map((line) => {
      return `│ ${line}`;
    }),
    '╰─ ·',
  ];
  return messages.join('\n');
}

export function label(format: Format | 'dts') {
  switch (format) {
    case 'esm':
      return pc.blue(`[ESM]`);
    case 'dts':
      return pc.green(`[DTS]`);
  }
}
