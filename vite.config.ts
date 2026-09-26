import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Tek bir index.html üretir: GitHub Pages, Netlify Drop ya da herhangi bir yere
// yüklenip telefondan açılabilir.
export default defineConfig({
  base: './',
  plugins: [vue(), viteSingleFile()],
})
