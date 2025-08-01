const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const { mockReset } = require('jest-mock-extended');

// Mock the prisma client for middleware unit tests FIRST
jest.mock('../lib/prisma', () => {
  const { mockDeep } = require('jest-mock-extended');
  return mockDeep();
});
const mockPrisma = require('../lib/prisma'); // Get a handle to the mock

const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const app = require('../app'); // Use the actual app

// We need a real prisma client for our integration tests
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();


describe('Auth End-to-End', () => {
  afterAll(async () => {
    await db.user.deleteMany({});
    await db.$disconnect();
  });

  it('should register a new user and then log them in', async () => {
    const agent = request.agent(app);
    const username = `testuser_${Date.now()}`;
    const password = 'password123';

    const registerRes = await agent.post('/register').send({ username, password });
    expect(registerRes.statusCode).toEqual(302);
    expect(registerRes.headers.location).toBe('/login');

    const user = await db.user.findUnique({ where: { username } });
    expect(user).not.toBeNull();

    const loginRes = await agent.post('/login').send({ username, password });
    expect(loginRes.statusCode).toEqual(302);
    expect(loginRes.headers.location).toBe('/dashboard');
  });

  it('should fail to log in with incorrect password', async () => {
    const username = `testfail_${Date.now()}`;
    const password = 'password123';
    const wrongPassword = 'wrongpassword';

    const hashedPassword = require('bcryptjs').hashSync(password, 10);
    await db.user.create({
      data: { username, password: hashedPassword, roleId: 2 },
    });

    const res = await request(app).post('/login').send({ username, password: wrongPassword });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/login');
  });
});

describe('Auth Middleware', () => {
  beforeEach(() => {
    mockReset(mockPrisma);
  });

  it('should redirect to login if not authenticated', async () => {
    const testApp = express();
    testApp.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
    testApp.use(flash());
    testApp.get('/test/protected', ensureAuthenticated, (req, res) => res.send('Protected Route'));

    const res = await request(testApp).get('/test/protected');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/login');
  });

  it('should return 403 if user does not have the correct role', async () => {
    const req = { session: { userId: 1 } };
    const res = { status: jest.fn(() => res), send: jest.fn() };
    const next = jest.fn();
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: { name: 'User' } });
    await checkRole(['Police'])(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should call next if user has the correct role', async () => {
    const req = { session: { userId: 1 } };
    const res = { status: jest.fn(() => res), send: jest.fn() };
    const next = jest.fn();
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: { name: 'Police' } });
    await checkRole(['Police'])(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
