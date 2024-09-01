import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.connected = false;
    const HOST = process.env.DB_HOST || 'localhost';
    const PORT = process.env.DB_PORT || 27017;
    const DATABASE = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${HOST}:${PORT}`;
    this.client = new MongoClient(uri);

    this.client.connect()
      .then(() => {
        this.connected = true;
        this.db = this.client.db(DATABASE);
      })
      .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
      });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const users = this.db.collection('users');
    const userCount = await users.countDocuments({});
    return userCount;
  }

  async nbFiles() {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const files = this.db.collection('files');
    const fileCount = await files.countDocuments({});
    return fileCount;
  }
}

const dbClient = new DBClient();
export default dbClient;
