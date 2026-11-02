import { app } from './app.js';
import { env } from './config/env.js';
import {
  logger,
} from './common/logging/logger.js';

app.listen(env.PORT, () => {
  logger.info('HTTP server started', {
    port: env.PORT,
  });
});
