const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { requireAdminAuth } = require('../src/middleware/auth');

describe('Authentication & Security Unit Tests', () => {
  const TEST_SECRET = 'unit_test_jwt_secret_key_12345';
  process.env.JWT_SECRET = TEST_SECRET;

  describe('Password Hashing with bcrypt', () => {
    it('should hash a password and correctly verify the valid password', async () => {
      const rawPassword = 'SecureAdminPassword2026!';
      const hash = await bcrypt.hash(rawPassword, 10);

      expect(hash).not.toBe(rawPassword);
      expect(hash).toMatch(/^\$2[aby]\$.{56}$/);

      const isMatch = await bcrypt.compare(rawPassword, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('requireAdminAuth Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFn;

    beforeEach(() => {
      mockRes = {};
      nextFn = jest.fn();
    });

    it('should reject request when no cookie or header is provided', () => {
      mockReq = { cookies: {}, headers: {} };
      requireAdminAuth(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
      const error = nextFn.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Authentication required');
    });

    it('should authenticate valid token in cookie', () => {
      const payload = { id: 'admin-uuid-1', email: 'admin@test.com', name: 'Test Admin' };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

      mockReq = {
        cookies: { token },
        headers: {},
      };

      requireAdminAuth(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith();
      expect(mockReq.admin).toBeDefined();
      expect(mockReq.admin.id).toBe('admin-uuid-1');
      expect(mockReq.admin.email).toBe('admin@test.com');
    });

    it('should authenticate valid token in Authorization Bearer header', () => {
      const payload = { id: 'admin-uuid-2', email: 'bearer@test.com', name: 'Bearer Admin' };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

      mockReq = {
        cookies: {},
        headers: { authorization: `Bearer ${token}` },
      };

      requireAdminAuth(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith();
      expect(mockReq.admin.email).toBe('bearer@test.com');
    });

    it('should reject expired tokens with 401', () => {
      const payload = { id: 'admin-uuid-3', email: 'expired@test.com' };
      // Expired 1 second ago
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });

      mockReq = {
        cookies: { token },
        headers: {},
      };

      requireAdminAuth(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
      const error = nextFn.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('expired');
    });

    it('should reject token signed with invalid secret', () => {
      const payload = { id: 'admin-uuid-4' };
      const invalidToken = jwt.sign(payload, 'wrong_secret_key');

      mockReq = {
        cookies: { token: invalidToken },
        headers: {},
      };

      requireAdminAuth(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
      const error = nextFn.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Invalid or corrupted');
    });
  });
});
