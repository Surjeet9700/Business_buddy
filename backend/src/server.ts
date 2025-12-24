import { app } from './app';
import { env } from './config/env';
import { database } from './config/database';

const startServer = async () => {
    try {
        await database.connect();

        const PORT = env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
