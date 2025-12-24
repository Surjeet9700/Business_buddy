import { PrismaClient } from '@prisma-client';
import { withAccelerate } from '@prisma/extension-accelerate';

export class Database {
    private static instance: Database;
    public client: PrismaClient;

    private constructor() {
        this.client = new PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async connect(): Promise<void> {
        try {
            await this.client.$connect();
            console.log('✅ Database connected successfully');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }

    public async disconnect(): Promise<void> {
        await this.client.$disconnect();
        console.log('🔌 Database disconnected');
    }
}

export const db = Database.getInstance().client;
export const database = Database.getInstance();
