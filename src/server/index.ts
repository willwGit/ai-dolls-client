import express from 'express';
import next from 'next';
import { config } from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppConfigEnv } from '@/lib/utils';

config({ path: '.env' });
const devProxy = {
  '/ai-love-web': {
    target: AppConfigEnv.HOST,
    pathRewrite: {
      '^/ai-love-web': '',
    },
    changeOrigin: true,
  },
};

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({
  dev,
});
const handle = app.getRequestHandler();

const start = () => {
  const server = express();

  if (dev && devProxy) {
    Object.keys(devProxy).forEach((context) => {
      server.use(
        createProxyMiddleware(
          context,
          devProxy[context as keyof typeof devProxy]
        )
      );
    });
  }

  server.all('*', (req, res) => {
    handle(req, res);
  });

  // 准备生成 .next 文件
  app.prepare().then(() => {
    server.listen(port, () => {
      console.log(
        '\x1b[36m%s\x1b[0m',
        `🎉🎉> Ready on http://localhost:${port}. Port: ${port}`
      );
    });
  });
};
start();
