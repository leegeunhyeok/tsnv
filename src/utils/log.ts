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
