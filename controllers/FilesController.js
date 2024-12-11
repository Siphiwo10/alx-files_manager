// Import dependencies
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

// Define constants
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

// Helper to ensure folder exists
const ensureFolderExists = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// POST /upload
const postUpload = async (req, res) => {
  try {
    ensureFolderExists(FOLDER_PATH);

    const { name, type, data, parentId, isPublic = false } = req.body;

    // Validate input
    if (!name || !type) {
      return res.status(400).json({ error: 'Missing required fields: name or type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing required field: data' });
    }

    // Validate parentId if provided
    if (parentId && parentId !== '0') {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parentFile || parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'ParentId is not a valid folder' });
      }
    }

    // Handle folder creation
    if (type === 'folder') {
      const folderInfo = {
        name,
        type,
        isPublic,
        parentId: parentId || '0',
        userId: req.userId,
        createdAt: new Date(),
      };

      const result = await dbClient.db.collection('files').insertOne(folderInfo);
      return res.status(201).json({ id: result.insertedId, ...folderInfo });
    }

    // Decode file data and save to disk
    const decodedData = Buffer.from(data, 'base64');
    const filePath = path.join(FOLDER_PATH, `${new ObjectId()}`);
    fs.writeFileSync(filePath, decodedData);

    // Save file metadata to database
    const fileInfo = {
      name,
      type,
      isPublic,
      localPath: filePath,
      parentId: parentId || '0',
      userId: req.userId,
      createdAt: new Date(),
    };

    const result = await dbClient.db.collection('files').insertOne(fileInfo);
    res.status(201).json({ id: result.insertedId, ...fileInfo });
  } catch (err) {
    res.status(500).json({ error: 'Error uploading file', message: err.message });
  }
};

// GET /files/:id
const getShow = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id) });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.status(200).json(file);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving file', message: err.message });
  }
};

// GET /files/:id/data
const getFileData = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id) });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: 'Cannot download a folder' });
    }

    if (!fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'File data not found on server' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    fs.createReadStream(file.localPath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving file data', message: err.message });
  }
};

// PUT /files/:id/publish
const publishFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { isPublic: true } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.status(200).json(result.value);
  } catch (err) {
    res.status(500).json({ error: 'Error publishing file', message: err.message });
  }
};

// PUT /files/:id/unpublish
const unpublishFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { isPublic: false } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.status(200).json(result.value);
  } catch (err) {
    res.status(500).json({ error: 'Error unpublishing file', message: err.message });
  }
};

// Export the controller
const FilesController = {
  postUpload,
  getShow,
  getFileData,
  publishFile,
  unpublishFile,
};

export default FilesController;

