import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';

const AuthController = {
  async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    const hashedPassword = sha1(password);
    try {
      const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const token = uuidv4();
      await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 86400);
      res.status(200).json({ token });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getDisconnect(req, res) {
    const { 'x-token': token } = req.headers;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      await redisClient.del(`auth_${token}`);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default AuthController;

