import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';
import stylex from '@stylexjs/unplugin';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const publicRoot = resolve(process.cwd(), 'public');

const staticDirectoryIndexes = {
  name: 'static-directory-indexes',
  configureServer(server: { middlewares: { use: (handler: (request: { url?: string }, response: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((request, _response, next) => {
      const [pathname, query] = (request.url ?? '').split('?');
      if (pathname === '/' || !pathname.endsWith('/')) {
        next();
        return;
      }

      const routeDirectory = resolve(publicRoot, `.${decodeURIComponent(pathname)}`);
      const indexFile = resolve(routeDirectory, 'index.html');
      if (indexFile.startsWith(`${publicRoot}${sep}`) && existsSync(indexFile)) {
        request.url = `${pathname}index.html${query ? `?${query}` : ''}`;
      }

      next();
    });
  },
};

export default defineConfig({
  plugins: [stylex.vite(), staticDirectoryIndexes, solid({ start: true })],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
});
