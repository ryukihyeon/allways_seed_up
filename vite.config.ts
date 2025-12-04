import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/kakao-api': {
            target: 'https://dapi.kakao.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/kakao-api/, ''),
            headers: {
              'Authorization': `KakaoAK ${env.VITE_KAKAO_API_KEY}`
            }
          },
          '/kakao-navi': {
            target: 'https://apis-navi.kakaomobility.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/kakao-navi/, ''),
            headers: {
              'Authorization': `KakaoAK ${env.VITE_KAKAO_API_KEY}`
            }
          },
          '/tmap-api': {
            target: 'https://apis.openapi.sk.com/tmap',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/tmap-api/, ''),
            headers: {
              'appKey': env.VITE_TMAP_API_KEY || ''
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
