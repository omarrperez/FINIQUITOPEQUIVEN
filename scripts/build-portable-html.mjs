import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, '.portable-dist');
const publicTarget = path.join(rootDir, 'public', 'PetroFiniquito_CRISBAORCA_2009.html');

async function generatePortableHTML() {
  console.log('Compilando versión portable en un solo archivo HTML...');

  await build({
    configFile: false,
    root: rootDir,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      assetsInlineLimit: 100_000_000,
      cssCodeSplit: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          format: 'iife',
          inlineDynamicImports: true,
          entryFileNames: 'portable-app.js',
          chunkFileNames: 'portable-chunk-[name].js',
          assetFileNames: 'portable-asset-[name].[ext]',
        },
      },
    },
  });

  const builtHtmlPath = path.join(outDir, 'index.html');
  let html = fs.readFileSync(builtHtmlPath, 'utf8');

  // Find generated CSS and JS files inside .portable-dist/
  const files = fs.readdirSync(outDir);
  const cssFiles = files.filter((f) => f.endsWith('.css'));
  const jsFiles = files.filter((f) => f.endsWith('.js'));

  const combinedCSS = cssFiles
    .map((f) => fs.readFileSync(path.join(outDir, f), 'utf8'))
    .join('\n');
  const combinedJS = jsFiles
    .map((f) => fs.readFileSync(path.join(outDir, f), 'utf8'))
    .join('\n')
    // Prevent any accidental </script> sequence inside bundled libraries from closing the tag early
    .replace(/<\/script>/gi, '<\\/script>');

  // Strip external stylesheet links and module script tags emitted by Vite
  html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '');
  html = html.replace(/<script\b[^>]*src=["'][^"']+["'][^>]*><\/script>/gi, '');
  html = html.replace(/<script\b[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>/gi, '');

  // Inject inlined CSS into <head>
  html = html.replace(
    '</head>',
    () => `  <style>\n${combinedCSS}\n  </style>\n</head>`
  );

  // Inject classic IIFE <script> into <body> right after #root so it executes cleanly under file:// in Chrome, Edge, and Opera
  html = html.replace(
    '</body>',
    () => `  <script>\n${combinedJS}\n  </script>\n</body>`
  );

  fs.mkdirSync(path.dirname(publicTarget), { recursive: true });
  fs.writeFileSync(publicTarget, html, 'utf8');
  fs.rmSync(outDir, { recursive: true, force: true });

  const sizeMB = (Buffer.byteLength(html, 'utf8') / (1024 * 1024)).toFixed(2);
  console.log(`Archivo HTML portable generado exitosamente: ${publicTarget} (${sizeMB} MB)`);
}

generatePortableHTML().catch((err) => {
  console.error('Error generando HTML portable:', err);
  process.exit(1);
});
