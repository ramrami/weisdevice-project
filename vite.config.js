import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three', 'gsap'], // split big libs into separate file
        }
      },
      input: {
        main: resolve(__dirname, 'index.html'),
        interphysis: resolve(__dirname, 'interphysis.html'),
        anglerfish: resolve(__dirname, 'anglerfish.html'),
        dna: resolve(__dirname, 'dna.html'),
        boxman: resolve(__dirname, 'boxman.html'),
        futurehuman: resolve(__dirname, 'futurehuman.html'),
      }
    }
  }
})