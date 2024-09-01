import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    // Attach the error event listener
    this.client.on('error', (err) => console.log(err));

    // Explicitly connect to Redis
    this.client.connect();
  }

  isAlive() {
    return this.client.isOpen;
  }

  async get(key) {
    const value = await this.client.get(key);
    return value;
  }

  async set(key, value, duration) {
    await this.client.set(key, value, {
      EX: duration, // Expiration time in seconds
    });
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
