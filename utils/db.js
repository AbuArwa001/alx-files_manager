import { MongoClient, ObjectId } from 'mongodb';

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

  async getUserById(userId) {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const users = this.db.collection('users');
    const objectId = new ObjectId(userId);
    const user = await users.findOne({ _id: objectId });
    return user;
  }

  async findUserByEmailAndPassword(email, password) {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const users = this.db.collection('users');
    const user = await users.findOne({ email, password });
    return user;
  }

  async getFile(fileId) {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const files = this.db.collection('files');
    const id = new ObjectId(fileId);

    const file = await files.findOne({ _id: id });
    return file;
  }

  async getFiles(parentId, page) {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const files = this.db.collection('files');
    const query = parentId ? { parentId } : {};
    const cursor = files.aggregate([
      { $match: query },
      { $skip: page > 0 ? ((page - 1) * 20) : 0 },
      { $limit: 20 },
    ]);
    const filesList = await cursor.toArray();
    return filesList;
  }

  async createFile({
    userId,
    name, type, parentId, isPublic, localPath,
  }) {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const files = this.db.collection('files');
    const newFile = {
      userId,
      name,
      type,
      parentId,
      isPublic,
      localPath,
    };
    const result = await files.insertOne(newFile);
    return result;
  }

  async publishFile(fileId) {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const files = this.db.collection('files');
    const id = new ObjectId(fileId);
    const result = await files.updateOne({ _id: id }, { $set: { isPublic: true } });
    return result;
  }

  async unpublishFile(fileId) {
    if (!this.connected) {
      throw new Error('MongoDB client is not connected');
    }
    const files = this.db.collection('files');
    const id = new ObjectId(fileId);
    const result = await files.updateOne({ _id: id }, { $set: { isPublic: false } });
    return result;
  }
}

const dbClient = new DBClient();
export default dbClient;
