import { Response } from 'express';
import { requireRole } from '@/modules/auth/roles.middleware';
import { RequestWithUser, Role } from '@/types';

describe('Roles Middleware', () => {
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should return a function of type RequestHandler', () => {
    const middleware = requireRole(Role.admin);
    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3); // (req, res, next)
  });

  it('should return 403 if no user on request', () => {
    const middleware = requireRole(Role.admin, Role.minter);

    middleware(mockRequest as RequestWithUser, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Access denied: authentication required',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 if user has wrong role', () => {
    mockRequest.user = { role: Role.user, fields: [] };
    const middleware = requireRole(Role.admin, Role.minter);

    middleware(mockRequest as RequestWithUser, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Access denied: requires one of these roles: admin, minter',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next if user has one of the allowed roles', () => {
    // Test admin access
    mockRequest.user = { role: Role.admin, fields: [] };
    const adminMiddleware = requireRole(Role.admin, Role.minter);
    adminMiddleware(mockRequest as RequestWithUser, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();

    // Reset mocks
    nextFunction.mockClear();
    (mockResponse.status as jest.Mock)?.mockClear();
    (mockResponse.json as jest.Mock)?.mockClear();

    // Test minter access
    mockRequest.user = { role: Role.minter, fields: [] };
    const minterMiddleware = requireRole(Role.admin, Role.minter);
    minterMiddleware(mockRequest as RequestWithUser, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });
});
