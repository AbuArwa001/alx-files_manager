/* eslint-disable jest/no-hooks */
/* eslint-disable jest/prefer-expect-assertions */
const request = require('supertest');

const fs = require('fs');
const path = require('path');
const app = require('../../server');
const dbClient = require('../../utils/db');
const redisClient = require('../../utils/redis');

jest.mock('../../utils/db');
jest.mock('../../utils/redis');

describe('gET /files/:id/data', () => {
  let file;
  let userId;
  let token;
  let filePath;

  beforeEach(() => {
    userId = 'user123';
    token = 'valid-token';
    filePath = path.join(__dirname, '..', '..', 'image.png');

    file = {
      _id: 'file123',
      userId,
      name: 'image.png',
      type: 'image',
      isPublic: false,
      localPath: filePath,
    };

    redisClient.get.mockResolvedValue(userId);
    dbClient.getFile.mockResolvedValue(file);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('file data'));
  });

  // Remove the line `jest.restoreAllMocks();`

  it('should return 404 if the file does not exist', async () => {
    dbClient.getFile.mockResolvedValue(null);

    const res = await request(app)
      .get('/files/file123/data')
      .set('x-token', token);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('should return 404 if the user is not authorized to access the file', async () => {
    redisClient.get.mockResolvedValue('differentUserId');

    const res = await request(app)
      .get('/files/file123/data')
      .set('x-token', token);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('should return 400 if the file is a folder', async () => {
    file.type = 'folder';

    const res = await request(app)
      .get('/files/file123/data')
      .set('x-token', token);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("A folder doesn't have content");
  });

  it('should return 404 if the local file does not exist', async () => {
    fs.existsSync.mockReturnValue(false);

    const res = await request(app)
      .get('/files/file123/data')
      .set('x-token', token);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found localpath');
  });
  expect(res.body.error).toBe('Not found');
  it('should return the file data with the correct Content-Type', async () => {
    const res = await request(app)
      .get('/files/file123/data')
      .set('x-token', token);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.text).toBe('file data');
  });

  it('should return the correct thumbnail based on size query parameter', async () => {
    fs.existsSync.mockReturnValueOnce(false); // No original file
    fs.existsSync.mockReturnValueOnce(true); // Thumbnail exists
    file.localPath = path.join(__dirname, '..', '..', 'image_100.png');

    const res = await request(app)
      .get('/files/file123/data?size=100')
      .set('x-token', token);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.text).toBe('file data');
  });
});
