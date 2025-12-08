import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.ACCESS_KEY': JSON.stringify(env.ACCESS_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

## 2. Переменные в Vercel

**Project Settings → Environment Variables:**
```
GEMINI_API_KEY = ваш_ключ_гемини
ACCESS_KEY = ваш_секретный_ключ_для_доступа
