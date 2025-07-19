const request = require('supertest');
const app = require('../src/server');

describe('Authentication Routes', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user with valid data', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email', userData.email);
        });

        it('should return 400 for invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'password123'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
        });

        it('should return 400 for short password', async () => {
            const userData = {
                email: 'test@example.com',
                password: '123'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('user');
        });

        it('should return 401 for invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return 401 without authentication', async () => {
            await request(app)
                .get('/api/auth/me')
                .expect(401);
        });
    });
}); 