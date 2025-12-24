import { db } from '@/config/database';
import { AppError, BadRequestError, UnauthorizedError } from '@/utils/AppError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { User, AppRole } from '@prisma/client';

interface RegisterDto {
    email: string;
    password: string;
    name: string;
}

interface LoginDto {
    email: string;
    password: string;
}

interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export class AuthService {
    private static instance: AuthService;

    private constructor() { }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async register(data: RegisterDto) {
        const existingUser = await db.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('Email already registered', 409);
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await db.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                name: data.name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        });

        return user;
    }

    public async login(data: LoginDto): Promise<{ user: Partial<User> & { roles: AppRole[] }, tokens: Tokens }> {
        const user = await db.user.findUnique({
            where: { email: data.email },
            include: {
                userRoles: {
                    include: {
                        role: true
                    }
                }
            }
        });

        if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Account is disabled');
        }

        const roles = user.userRoles.map((ur: any) => ur.role.name);
        const tokens = await this.generateTokens(user.id, roles);

        // Save refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await db.refreshToken.create({
            data: {
                token: tokens.refreshToken,
                userId: user.id,
                expiresAt: expiresAt,
            }
        });

        await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: roles,
            },
            tokens: tokens
        };
    }

    private async generateTokens(userId: string, roles: AppRole[]): Promise<Tokens> {
        const accessToken = jwt.sign(
            { userId, roles },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
        );

        const refreshToken = jwt.sign(
            { userId },
            env.REFRESH_TOKEN_SECRET,
            { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: 900 // 15 minutes in seconds
        };
    }
}

export const authService = AuthService.getInstance();
