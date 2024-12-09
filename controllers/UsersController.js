import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) {
      return response.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return response.status(400).json({ error: 'Missing password' });
    }

    const hashPwd = sha1(password);

    try {
      const collection = dbClient.db.collection('users');
      const existingUser = await collection.findOne({ email });

      if (existingUser) {
        return response.status(400).json({ error: 'Already exist' });
      }

      const result = await collection.insertOne({ email, password: hashPwd });
      const newUser = await collection.findOne({ _id: result.insertedId });
      return response.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      console.error('Error creating user:', error);
      return response.status(500).json({ error: 'Server error' });
    }
  }

  static async getMe(request, response) {
    try {
      const userToken = request.header('X-Token');
      if (!userToken) {
        return response.status(401).json({ error: 'Missing token' });
      }

      const authKey = `auth_${userToken}`;
      const userID = await redisClient.get(authKey);

      if (!userID) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.getUser({ _id: ObjectId(userID) });
      if (!user) {
        return response.status(404).json({ error: 'User not found' });
      }

      return response.json({ id: user._id, email: user.email });
    } catch (error) {
      console.error('Error fetching user:', error);
      return response.status(500).json({ error: 'Server error' });
    }
  }
}

export default UsersController;

