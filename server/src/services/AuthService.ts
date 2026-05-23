import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { IUserResponse } from '@dndmeal/shared';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(userId: string): string {
    return jwt.sign({ userId }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE as string | number,
    } as SignOptions);
  }

  static verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      return decoded as { userId: string };
    } catch {
      return null;
    }
  }

  static userToResponse(user: any): IUserResponse {
    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    };
  }

  static async registerFirstUser(
    email: string,
    password: string,
    name: string
  ): Promise<{ token: string; user: IUserResponse }> {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      throw new Error('First user already exists');
    }

    const passwordHash = await this.hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      name,
      isAdmin: true,
    });

    const token = this.generateToken(user._id.toString());
    return { token, user: this.userToResponse(user) };
  }

  static async registerWithInvite(
    email: string,
    password: string,
    name: string
  ): Promise<{ token: string; user: IUserResponse }> {
    const passwordHash = await this.hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      name,
      isAdmin: false,
    });

    const token = this.generateToken(user._id.toString());
    return { token, user: this.userToResponse(user) };
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: IUserResponse }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const token = this.generateToken(user._id.toString());
    return { token, user: this.userToResponse(user) };
  }
}
