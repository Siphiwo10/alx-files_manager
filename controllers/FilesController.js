const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const mongoClient = require('mongodb').MongoClient;
const dbClient = new mongoClient(process.env.DB_URI || 'mongodb://localhost:27017', { useUnifiedTopology: true });

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const user = await getUserByToken(token);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name, type, parentId = 0, isPublic = false, data } = req.body;
      if (!name) return res.status(400).json({ error: 'Missing name' });
      if (!['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
      if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

      const db = dbClient.db('files_manager');
      const parentFile = parentId ? await db.collection('files').findOne({ _id: parentId }) : null;

      if (parentId && !parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile && parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });

      const fileDoc = { userId: user._id, name, type, isPublic, parentId };
      if (type !== 'folder') {
        const localPath = path.join(FOLDER_PATH, uuidv4());
        fileDoc.localPath = localPath;
        fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      }

      const result = await db.collection('files').insertOne(fileDoc);
      res.status(201).json({ id: result.insertedId, ...fileDoc });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getShow(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const user = await getUserByToken(token);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const fileId = req.params.id;
      const db = dbClient.db('files_manager');
      const file = await db.collection('files').findOne({ _id: fileId, userId: user._id });

      if (!file) return res.status(404).json({ error: 'Not found' });
      res.json(file);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const user = await getUserByToken(token);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { parentId = 0, page = 0 } = req.query;
      const limit = 20;
      const skip = page * limit;

      const db = dbClient.db('files_manager');
      const files = await db
        .collection('files')
        .find({ parentId, userId: user._id })
        .skip(skip)
        .limit(limit)
        .toArray();

      res.json(files);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async putPublish(req, res) {
    await togglePublish(req, res, true);
  }

  static async putUnpublish(req, res) {
    await togglePublish(req, res, false);
  }
}

async function togglePublish(req, res, isPublic) {
  try {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const user = await getUserByToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const db = dbClient.db('files_manager');
    const file = await db.collection('files').findOne({ _id: fileId, userId: user._id });

    if (!file) return res.status(404).json({ error: 'Not found' });

    await db.collection('files').updateOne({ _id: fileId }, { $set: { isPublic } });
    res.json({ id: fileId, isPublic });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUserByToken(token) {
  // Mock function; replace with actual user authentication logic
  const db = dbClient.db('files_manager');
  return await db.collection('users').findOne({ token });
}

module.exports = FilesController;
