const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient(); // Create the client

    // Attach the error event listener
    this.client.on('error', (err) => console.log(err));

    // Explicitly connect to Redis
    this.client.on('connect', () => {});
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });
  }

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, 'EX', duration, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}

const redisClient = new RedisClient();
redisClient.client.on('connect', () => {});
export default redisClient;
