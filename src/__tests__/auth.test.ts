import request from 'supertest';
import app from '../index.js';

const testEmail = `test_${Date.now()}@uteq.edu.mx`;
const testPassword = 'Test1234';

describe('Auth API', () => {

    describe('POST /api/auth/register', () => {
        it('debe registrar un usuario nuevo exitosamente', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    nombre: 'Usuario Test',
                    email: testEmail,
                    password: testPassword
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
        });

        it('debe fallar si el email ya existe', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    nombre: 'Usuario Test',
                    email: testEmail,
                    password: testPassword
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('debe fallar si faltan campos', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'incompleto@uteq.edu.mx' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('debe fallar si la contraseña es menor a 6 caracteres', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    nombre: 'Test',
                    email: 'corto@uteq.edu.mx',
                    password: '123'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('debe hacer login exitosamente', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
        });

        it('debe fallar con contraseña incorrecta', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('debe fallar si faltan campos', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /', () => {
        it('debe responder con mensaje de API', async () => {
            const res = await request(app).get('/');
            expect(res.status).toBe(200);
    expect(res.body.message).toContain('UTEQ Connect API');
        });
    });

});