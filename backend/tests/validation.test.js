const {
  validateInquiry,
  validateLogin,
  validateStatusUpdate,
} = require('../src/middleware/validate');

describe('Validation Middleware Tests', () => {
  let mockReq;
  let mockRes;
  let nextFn;

  beforeEach(() => {
    mockRes = {};
    nextFn = jest.fn();
  });

  describe('validateInquiry', () => {
    it('should reject empty or missing fields', () => {
      mockReq = { body: {} };
      validateInquiry(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
      const error = nextFn.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.details.name).toBeDefined();
      expect(error.details.email).toBeDefined();
      expect(error.details.phone).toBeDefined();
      expect(error.details.user_type).toBeDefined();
      expect(error.details.category).toBeDefined();
      expect(error.details.message).toBeDefined();
    });

    it('should reject invalid email formats', () => {
      mockReq = {
        body: {
          name: 'Jane Doe',
          email: 'not-an-email',
          phone: '+1 555-123-4567',
          user_type: 'Student',
          category: 'Scholarship',
          message: 'I would like to apply for the STEM scholarship.',
        },
      };
      validateInquiry(mockReq, mockRes, nextFn);

      const error = nextFn.mock.calls[0][0];
      expect(error.details.email).toContain('valid email address');
    });

    it('should reject invalid phone numbers with fewer than 7 digits', () => {
      mockReq = {
        body: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '123',
          user_type: 'Student',
          category: 'Scholarship',
          message: 'I would like to apply for the STEM scholarship.',
        },
      };
      validateInquiry(mockReq, mockRes, nextFn);

      const error = nextFn.mock.calls[0][0];
      expect(error.details.phone).toContain('7 to 15 digits');
    });

    it('should reject invalid user_type outside allowed list', () => {
      mockReq = {
        body: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1 555-123-4567',
          user_type: 'Alien',
          category: 'Scholarship',
          message: 'I would like to apply for the STEM scholarship.',
        },
      };
      validateInquiry(mockReq, mockRes, nextFn);

      const error = nextFn.mock.calls[0][0];
      expect(error.details.user_type).toContain('Parent, Student, School');
    });

    it('should reject invalid category outside allowed list', () => {
      mockReq = {
        body: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1 555-123-4567',
          user_type: 'Parent',
          category: 'Random Topic',
          message: 'I would like more information on admissions.',
        },
      };
      validateInquiry(mockReq, mockRes, nextFn);

      const error = nextFn.mock.calls[0][0];
      expect(error.details.category).toContain('Scholarship, Concert, Admission, General Query');
    });

    it('should reject messages that are too short (< 10 chars)', () => {
      mockReq = {
        body: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1 555-123-4567',
          user_type: 'Student',
          category: 'Admission',
          message: 'Hi',
        },
      };
      validateInquiry(mockReq, mockRes, nextFn);

      const error = nextFn.mock.calls[0][0];
      expect(error.details.message).toContain('at least 10 characters');
    });

    it('should succeed and sanitize trimmed values when payload is valid', () => {
      mockReq = {
        body: {
          name: '  Alex Smith  ',
          email: '  Alex.Smith@EXAMPLE.COM  ',
          phone: '  +1 (555) 234-5678  ',
          user_type: 'Student',
          category: 'Scholarship',
          message: '  I would love to apply for the upcoming summer session scholarship.  ',
        },
      };
      validateInquiry(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith(); // Called without error
      expect(mockReq.body.name).toBe('Alex Smith');
      expect(mockReq.body.email).toBe('alex.smith@example.com');
      expect(mockReq.body.phone).toBe('+1 (555) 234-5678');
      expect(mockReq.body.message).toBe('I would love to apply for the upcoming summer session scholarship.');
    });
  });

  describe('validateLogin', () => {
    it('should require both email and password', () => {
      mockReq = { body: {} };
      validateLogin(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
      const error = nextFn.mock.calls[0][0];
      expect(error.details.email).toBeDefined();
      expect(error.details.password).toBeDefined();
    });

    it('should pass with valid email and password', () => {
      mockReq = {
        body: {
          email: 'admin@edtech.com',
          password: 'Password123!',
        },
      };
      validateLogin(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith();
    });
  });

  describe('validateStatusUpdate', () => {
    it('should reject invalid status', () => {
      mockReq = { body: { status: 'Archived' } };
      validateStatusUpdate(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
      const error = nextFn.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });

    it('should accept valid statuses (New, In Progress, Resolved)', () => {
      const statuses = ['New', 'In Progress', 'Resolved'];
      statuses.forEach((status) => {
        const next = jest.fn();
        mockReq = { body: { status } };
        validateStatusUpdate(mockReq, mockRes, next);
        expect(next).toHaveBeenCalledWith();
      });
    });
  });
});
