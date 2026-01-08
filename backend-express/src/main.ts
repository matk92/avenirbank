import dotenv from 'dotenv';
import { ExpressApp } from './infrastructure/express/app';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3002', 10);

async function bootstrap(): Promise<void> {
  try {
    console.log('Starting AVENIR Bank Express Backend...');
    
    const expressApp = new ExpressApp();
    const app = await expressApp.initialize();

    const server = app.listen(PORT, () => {
      console.log(`Express backend is running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Auth endpoints: http://localhost:${PORT}/auth/*`);
      console.log(`Account endpoints: http://localhost:${PORT}/accounts/*`);
      console.log(`Database: MongoDB`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = async (): Promise<void> => {
      console.log('\nShutting down gracefully...');
      
      server.close(() => {
        console.log('HTTP server closed');
      });

      await expressApp.shutdown();
      console.log('Database connections closed');
      
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start Express backend:', error);
    process.exit(1);
  }
}

bootstrap();
