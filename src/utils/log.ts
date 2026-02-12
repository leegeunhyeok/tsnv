import pc from 'picocolors';

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

export const ESM_LABEL = pc.blue(`[ESM]`);
export const DTS_LABEL = pc.green(`[DTS]`);
export const ASSET_LABEL = pc.yellow(`[AST]`);
