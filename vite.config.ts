import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode, command }) => {
  const plugins = [react(), tailwindcss()];

  // Dev-only source-tag instrumentation. Its Babel dependencies are only
  // available in the local workspace (shared node_modules), NOT on Vercel.
  // Guard with a resolvability check so production builds never touch it.
  if (command === 'serve') {
    try {
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      require.resolve('@babel/parser'); // throws if not installed
      // Build the specifier dynamically so esbuild cannot statically inline
      // this module (inlining hoists its Babel imports to the top level of
      // the bundled config, crashing environments without Babel installed).
      const specifier = ['.', '.vite-source-tags.js'].join('/');
      const m = await import(/* @vite-ignore */ specifier);
      plugins.push(m.sourceTags());
    } catch {
      // plugin unavailable — fine, it's optional
    }
  }

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
