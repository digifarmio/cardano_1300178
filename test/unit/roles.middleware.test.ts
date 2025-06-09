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
    const middleware = requireRole(Role.admin);

    middleware(mockRequest as RequestWithUser, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: "Access denied: requires role 'admin'",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 if user has wrong role', () => {
    mockRequest.user = { role: Role.user, fields: [] };
    const middleware = requireRole(Role.admin);

    middleware(mockRequest as RequestWithUser, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: "Access denied: requires role 'admin'",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next if user has correct role', () => {
    mockRequest.user = { role: Role.admin, fields: [] };
    const middleware = requireRole(Role.admin);

    middleware(mockRequest as RequestWithUser, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});
