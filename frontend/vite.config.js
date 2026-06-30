import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    // 本地开发默认走本机后端；联调远程时在 .env.development.local 设置：
    // VITE_API_PROXY_TARGET=http://8.166.115.78
    var apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000';
    return {
        plugins: [vue()],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true
                }
            }
        }
    };
});
