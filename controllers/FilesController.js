import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const { name, type, data, parentId = 0, isPublic = false } = req.body;
    const token = req.headers['x-token'];

    // Validate the inputs
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['file', 'image', 'folder'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Retrieve user from token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the parentId exists and is a folder (for non-folder types)
    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: parentId });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Set the storage path
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // If the file is a file or image, generate a unique file path
    let localPath = '';
    if (type !== 'folder') {
      const fileId = uuidv4();
      localPath = path.join(folderPath, fileId);
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, buffer); // Save the file to disk
    }

    // Save the file metadata in the database
    const fileDocument = {
      userId,
      name,
      type,
      parentId,
      isPublic,
      localPath: localPath || null,
    };

    const result = await dbClient.db.collection('files').insertOne(fileDocument);

    // Return the new file with status code 201
    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: localPath || null,
    });
  }
}

export default FilesController;

