import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 5174,
    },
    plugins: [
        react(),
        // Figure out how to make this work with Astro first. Until then imports are separate.
        libInjectCss(),
        svgr(),
        dts({ include: ['lib'] }),
        {
            name: "isolation",
            configureServer(server) {
                server.middlewares.use((_req, res, next) => {
                    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                    next();
                });
            },
        },
    ],
    build: {
        copyPublicDir: false,
        lib: {
            entry: resolve(__dirname, 'lib/main.ts'),
            formats: ['es'],
        },
        rollupOptions: {
            external: ['react', 'react/jsx-runtime'],
        }
    }
})
