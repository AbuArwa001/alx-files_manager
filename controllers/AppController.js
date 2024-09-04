import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(_, res) {
    try {
      const redis = redisClient.isAlive();
      const db = dbClient.isAlive();
      return res.status(200).send({ redis, db });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ redis: false, db: false });
    }
  }

  static async getStats(_, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();
    res.status(200).json({ users: usersCount, files: filesCount });
  }
}

export default AppController;
