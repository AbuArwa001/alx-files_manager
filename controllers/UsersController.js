import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    try {
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }
      const coll = dbClient.db.collection('users');
      const user = await coll.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const passwordHash = crypto.createHash('sha1').update(req.body.password).digest('hex');
      const newUser = await coll.insertOne({ email, password: passwordHash });
      return res.status(201).json({ id: newUser.insertedId, email });
    } catch (error) {
      console.error('Error creating new user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getUserbyToken(token) {
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return null;
    }
    const user = await dbClient.getUserById(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  static async me(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default UsersController;
