import { $ } from 'zx';

export default async function setup() {
  await $`yarn pack --out tsnv.tgz`;
}
