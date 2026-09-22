// The supervised preview passes Vite flags; regular local development uses Next.js.
const supervised = process.argv.includes('--strictPort');
process.argv.splice(2, 0, 'dev');
if (supervised) {
  await import('./run-framework.mjs');
} else {
  await import('../node_modules/next/dist/bin/next');
}
