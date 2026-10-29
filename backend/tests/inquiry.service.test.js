const db = require('../src/config/db');
const inquiryService = require('../src/services/inquiryService');
const dashboardService = require('../src/services/dashboardService');

// Spy on db.query
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  testConnection: jest.fn(),
}));

describe('Inquiry & Dashboard Service Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInquiry', () => {
    it('should insert inquiry and return the saved record', async () => {
      const mockSaved = {
        id: 'mock-uuid-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 555-0199',
        user_type: 'Parent',
        category: 'Admission',
        message: 'Looking for 9th grade admission details.',
        status: 'New',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({ rows: [mockSaved], rowCount: 1 });

      const result = await inquiryService.createInquiry({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 555-0199',
        user_type: 'Parent',
        category: 'Admission',
        message: 'Looking for 9th grade admission details.',
      });

      expect(result.id).toBe('mock-uuid-1');
      expect(result.status).toBe('New');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO inquiries'),
        ['John Doe', 'john@example.com', '+1 555-0199', 'Parent', 'Admission', 'Looking for 9th grade admission details.']
      );
    });
  });

  describe('getInquiries with parameterized filters and search', () => {
    it('should construct correct parameterized SQL query with combined filters', async () => {
      // Mock count query
      db.query.mockResolvedValueOnce({ rows: [{ total: '2' }] });
      // Mock data query
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '1', name: 'Alice', category: 'Scholarship', user_type: 'Student', status: 'New' },
          { id: '2', name: 'Bob', category: 'Scholarship', user_type: 'Student', status: 'In Progress' },
        ],
      });

      const res = await inquiryService.getInquiries({
        category: 'Scholarship',
        user_type: 'Student',
        search: 'Alice',
        page: 1,
        limit: 10,
      });

      expect(res.inquiries).toHaveLength(2);
      expect(res.pagination.total).toBe(2);

      // Verify that query uses parameters $1, $2, etc., and does not concatenate raw search
      const dataCall = db.query.mock.calls[1];
      const sqlText = dataCall[0];
      const params = dataCall[1];

      expect(sqlText).toContain('category = $1');
      expect(sqlText).toContain('user_type = $2');
      expect(sqlText).toContain('name ILIKE $3');
      expect(params).toContain('Scholarship');
      expect(params).toContain('Student');
      expect(params).toContain('%Alice%');
    });
  });

  describe('updateInquiryStatus', () => {
    it('should update inquiry status and return updated row', async () => {
      const mockUpdated = {
        id: 'mock-uuid-2',
        status: 'Resolved',
        name: 'Mark',
      };
      db.query.mockResolvedValueOnce({ rows: [mockUpdated], rowCount: 1 });

      const result = await inquiryService.updateInquiryStatus('mock-uuid-2', 'Resolved');
      expect(result.status).toBe('Resolved');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE inquiries\s+SET status = \$1\s+WHERE id = \$2/i),
        ['Resolved', 'mock-uuid-2']
      );
    });

    it('should throw 404 when inquiry ID does not exist', async () => {
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(inquiryService.updateInquiryStatus('non-existent-id', 'Resolved'))
        .rejects
        .toThrow('Inquiry not found.');
    });
  });

  describe('dashboardService.getDashboardStats', () => {
    it('should calculate live metrics from database query result', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            total: 25,
            new_count: 10,
            in_progress_count: 7,
            resolved_count: 8,
          },
        ],
      });

      const stats = await dashboardService.getDashboardStats();
      expect(stats.total).toBe(25);
      expect(stats.new).toBe(10);
      expect(stats.inProgress).toBe(7);
      expect(stats.resolved).toBe(8);
    });
  });
});
