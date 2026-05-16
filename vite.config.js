import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer' // 👈 Visualizer import kiya

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: true, // 👈 Build hote hi khud browser me report khol dega
      filename: 'bundle-report.html',
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    target: 'esnext', // Modern browsers ke liye hyper-optimized code
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Third-party heavy libraries ko alag-alag chunks me split karna
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons'; // Saare icons ek chote chunk me
            }
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('d3')) {
              return 'vendor-charts'; // Charts alag dashboard ke liye
            }
            if (id.includes('swiper')) {
              return 'vendor-swiper'; // Swiper carousel alag
            }
            return 'vendor-core'; // Baki core (React, Router, Axios)
          }
        }
      }
    }
  }
})
