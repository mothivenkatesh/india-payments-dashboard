import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: {
      '/api/ckan': {
        target: 'https://ckan.indiadataportal.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ckan/, '/api/3/action'),
        secure: true,
      },
      '/api/npci': {
        target: 'https://www.npci.org.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/npci/, ''),
        secure: true,
        configure: (proxy) => {
          // Rewrite redirect Location headers so they loop back through the proxy
          // instead of going directly to npci.org.in (which causes CORS abort)
          proxy.on('proxyRes', (proxyRes) => {
            const loc = proxyRes.headers.location
            if (loc && /npci\.org\.in/i.test(loc)) {
              proxyRes.headers.location = loc.replace(/https?:\/\/(?:www\.)?npci\.org\.in/i, '/api/npci')
            }
          })
        },
      },
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chartjs': ['chart.js'],
        }
      }
    }
  }
})
