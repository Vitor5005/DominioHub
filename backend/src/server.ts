import { app } from './app.js';
import { env } from './config/env.js';

const apiPublicUrl =
  env.API_PUBLIC_URL.replace(/\/+$/, '');

const startupBanner = [
  '============================================================',
  ' DOMÍNIOHUB',
  '============================================================',
  ` Frontend : ${env.FRONTEND_URL}`,
  ` Backend  : ${apiPublicUrl}`,
  ` Health   : ${apiPublicUrl}/api/v1/health`,
  '============================================================',
  ' API pronta para receber requisições.',
].join('\n');

app.listen(env.PORT, () => {
  console.log(startupBanner);
});
