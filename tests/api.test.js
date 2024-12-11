const request = require('supertest');
const app = require('../path/to/app');  // Express app instance

describe('API Endpoints Tests', () => {
  // GET /status
  test('GET /status should return status', async () => {
    const response = await request(app).get('/status');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  // GET /stats
  test('GET /stats should return stats', async () => {
    const response = await request(app).get('/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalUsers');
    expect(response.body).toHaveProperty('totalFiles');
  });

  // POST /users
  test('POST /users should create a new user', async () => {
    const userData = { username: 'testUser', password: 'password123' };
    const response = await request(app).post('/users').send(userData);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(userData.username);
  });

  // GET /connect
  test('GET /connect should return connection success', async () => {
    const response = await request(app).get('/connect');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Connected');
  });

  // GET /disconnect
  test('GET /disconnect should return disconnect success', async () => {
    const response = await request(app).get('/disconnect');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Disconnected');
  });

  // GET /users/me
  test('GET /users/me should return user details', async () => {
    const response = await request(app).get('/users/me').set('Authorization', 'Bearer testToken');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe('testUser');
  });

  // POST /files
  test('POST /files should upload a file', async () => {
    const fileData = { fileName: 'testFile.txt', fileSize: 1024 };
    const response = await request(app).post('/files').send(fileData);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('fileId');
  });

  // GET /files/:id
  test('GET /files/:id should retrieve a file', async () => {
    const response = await request(app).get('/files/1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('fileName');
  });

  // GET /files (pagination)
  test('GET /files should return files with pagination', async () => {
    const response = await request(app).get('/files').query({ page: 1, limit: 10 });
    expect(response.status).toBe(200);
    expect(response.body.files).toBeInstanceOf(Array);
    expect(response.body).toHaveProperty('totalCount');
  });

  // PUT /files/:id/publish
  test('PUT /files/:id/publish should publish a file', async () => {
    const response = await request(app).put('/files/1/publish');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('published');
  });

  // PUT /files/:id/unpublish
  test('PUT /files/:id/unpublish should unpublish a file', async () => {
    const response = await request(app).put('/files/1/unpublish');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('unpublished');
  });

  // GET /files/:id/data
  test('GET /files/:id/data should return file data', async () => {
    const response = await request(app).get('/files/1/data');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});

