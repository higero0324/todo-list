import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = 'todo-list'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? `/${repositoryName}/` : '/',
})
