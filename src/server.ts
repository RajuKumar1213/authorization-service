import app from './app';
import { env } from './config/env';
import { logger } from './core/logger';

const startServer = () => {
  try {
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Received kill signal, shutting down gracefully');
      server.close(() => {
        logger.info('Closed out remaining connections');
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error(error, 'Error starting server');
    process.exit(1);
  }
};

startServer();
