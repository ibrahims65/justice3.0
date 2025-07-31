const request = require('supertest');
const express = require('express');
const session = require('express-session');
const { mockDeep, mockReset } = require('jest-mock-extended');
const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const prisma = require('../lib/prisma');

jest.mock('../lib/prisma', () => mockDeep());

beforeEach(() => {
  mockReset(prisma);
});

const app = express();

app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

app.get('/test/protected', ensureAuthenticated, (req, res) => {
  res.send('Protected Route');
});

app.get('/test/police', ensureAuthenticated, checkRole(['Police']), (req, res) => {
  res.send('Police Dashboard');
});

describe('Auth Middleware', () => {
  it('should redirect to login if not authenticated', async () => {
    const res = await request(app).get('/test/protected');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  it('should return 403 if user does not have the correct role', async () => {
    const req = {
      session: {
        userId: 1,
      },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    const next = jest.fn();

    prisma.user.findUnique.mockResolvedValue({ id: 1, role: { name: 'User' } });

    await checkRole(['Police'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if user has the correct role', async () => {
    const req = {
      session: {
        userId: 1,
      },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    const next = jest.fn();

    prisma.user.findUnique.mockResolvedValue({ id: 1, role: { name: 'Police' } });

    await checkRole(['Police'])(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
