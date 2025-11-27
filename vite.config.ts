// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
//
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// // 1. Importeer de Tailwind CSS plugin (CRUCIAAL)
// import tailwindcss from '@tailwindcss/vite'
//
// // https://vite.dev/config/
// export default defineConfig({
//     plugins: [
//         react(),
//         // 2. Voeg de plugin toe aan de lijst
//         tailwindcss(),
//     ],
// })


import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        tailwindcss(),
    ], base: '/redactie-app/',
})
