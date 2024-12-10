import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const ensureFolderExists = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

const postUpload = async (req, res) => {
  try {
    ensureFolderExists(FOLDER_PATH);
    const { file } = req.files;

    const filePath = path.join(FOLDER_PATH, file.name);
    await file.mv(filePath);

    const fileInfo = {
      name: file.name,
      size: file.size,
      path: filePath,
      uploadedAt: new Date(),
    };

    const result = await dbClient.db.collection('files').insertOne(fileInfo);
    res.status(201).json({ message: 'File uploaded successfully', file: fileInfo });
  } catch (err) {
    res.status(500).json({ message: 'Error uploading file', error: err });
  }
};

const getShow = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id) });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.status(200).json(file);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving file', error: err });
  }
};

const getIndex = async (req, res) => {
  try {
    const files = await dbClient.db.collection('files').find().toArray();
    res.status(200).json({ files });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching files', error: err });
  }
};

const putPublish = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { published: true } },
      { returnDocument: 'after' }
    );

    if (!file.value) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.status(200).json(file.value);
  } catch (err) {
    res.status(500).json({ message: 'Error publishing file', error: err });
  }
};

const putUnpublish = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { published: false } },
      { returnDocument: 'after' }
    );

    if (!file.value) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.status(200).json(file.value);
  } catch (err) {
    res.status(500).json({ message: 'Error unpublishing file', error: err });
  }
};

const getFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id) });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(file.path);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving file', error: err });
  }
};

export default {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
  getFile,
};

