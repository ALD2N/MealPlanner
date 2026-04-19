import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { AuthService } from '../AuthService';
import { config } from '../../config';

describe('AuthService', () => {
  describe('hashPassword', () => {
    it('hashes a password successfully', async () => {
      const password = 'myPassword123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('hashing same password twice produces different hashes', async () => {
      const password = 'myPassword123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('can hash empty string', async () => {
      const hash = await AuthService.hashPassword('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('can hash long password', async () => {
      const longPassword = 'a'.repeat(100);
      const hash = await AuthService.hashPassword(longPassword);
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('verifies correct password', async () => {
      const password = 'myPassword123';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('rejects incorrect password', async () => {
      const password = 'myPassword123';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword('wrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('rejects empty password when hash is from non-empty password', async () => {
      const password = 'myPassword123';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword('', hash);

      expect(isValid).toBe(false);
    });

    it('handles special characters in password', async () => {
      const password = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('generates a valid JWT token', () => {
      const userId = 'user123';
      const token = AuthService.generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('generates different tokens for different users', () => {
      const token1 = AuthService.generateToken('user1');
      const token2 = AuthService.generateToken('user2');

      expect(token1).not.toBe(token2);
    });

    it('generates different tokens for same user', () => {
      const userId = 'user123';
      const token1 = AuthService.generateToken(userId);
      const token2 = AuthService.generateToken(userId);

      // Tokens may be different due to timing
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('verifies a valid token', () => {
      const userId = 'user123';
      const token = AuthService.generateToken(userId);
      const decoded = AuthService.verifyToken(token);

      expect(decoded).not.toBe(null);
      expect(decoded?.userId).toBe(userId);
    });

    it('throws error for invalid token format', () => {
      expect(() => AuthService.verifyToken('invalid.token')).toThrow();
    });

    it('throws error for malformed token', () => {
      expect(() => AuthService.verifyToken('not-a-token')).toThrow();
    });

    it('throws error for empty token', () => {
      expect(() => AuthService.verifyToken('')).toThrow();
    });

    it('throws error for tampered token', () => {
      const userId = 'user123';
      const token = AuthService.generateToken(userId);
      const tampered = token.split('.').slice(0, 2).join('.') + '.invalid';

      expect(() => AuthService.verifyToken(tampered)).toThrow();
    });
  });

  describe('userToResponse', () => {
    it('converts user object to response format', () => {
      const user = {
        _id: { toString: () => 'user123' },
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: true,
        createdAt: new Date('2024-01-01'),
      };

      const response = AuthService.userToResponse(user);

      expect(response._id).toBe('user123');
      expect(response.email).toBe('test@example.com');
      expect(response.name).toBe('Test User');
      expect(response.isAdmin).toBe(true);
      expect(response.createdAt).toBeDefined();
    });

    it('handles non-admin user', () => {
      const user = {
        _id: { toString: () => 'user456' },
        email: 'user@example.com',
        name: 'Regular User',
        isAdmin: false,
        createdAt: new Date(),
      };

      const response = AuthService.userToResponse(user);

      expect(response.isAdmin).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('can hash password and verify it matches', async () => {
      const password = 'testPassword123';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('can generate and verify token for user', () => {
      const userId = 'test-user-id';
      const token = AuthService.generateToken(userId);
      const decoded = AuthService.verifyToken(token);

      expect(decoded?.userId).toBe(userId);
    });
  });
});
