import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const hashPwd = sha1(password);

    try {
      const collection = dbClient.db.collection('users');
      const existingUser = await collection.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const result = await collection.insertOne({ email, password: hashPwd });
      const newUser = await collection.findOne({ _id: result.insertedId });
      res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getMe(req, res) {
    try {
      const userToken = req.header('X-Token');
      if (!userToken) return res.status(401).json({ error: 'Missing token' });

      const userID = await redisClient.get(`auth_${userToken}`);
      if (!userID) return res.status(401).json({ error: 'Unauthorized' });

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userID) });
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({ id: user._id, email: user.email });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
}

export default UsersController;

