const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient();  // Create the client
   
    // Attach the error event listener
    this.client.on('error', (err) => console.log(err));

    // Explicitly connect to Redis
    this.client.on('connect', () => console.log(''));
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await this.client.get(key);
    return value;
  }

  async set(key, value, duration) {
    await this.client.set(key, value, 'EX', duration);
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
