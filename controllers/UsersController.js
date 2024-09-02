import dbClient from '../utils/db';
import crypto from 'crypto';

let shasum = crypto.createHash('sha1')

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
          const user = await coll.findOne({email});
          if (user) {
              return res.status(400).json({ error: 'Already exist'});
          } 
          const passwordHash = crypto.createHash("sha1").update(req.body.password).digest("hex");
          const newUser = await coll.insertOne({email: email, password: passwordHash})
          res.status(201).json({id: newUser.insertedId, email});
    } catch (error) {
        console.error('Error creating new user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

}
}

export default UsersController;
