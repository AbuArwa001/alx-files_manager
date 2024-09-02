import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    // Attach the error event listener
    this.client.on('error', (err) => console.log(err.code));

    // Explicitly connect to Redis
    this.client.connect().catch((err) => console.error('Connection error:', err));
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
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
