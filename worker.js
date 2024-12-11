import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';

const fileQueue = new Bull('fileQueue'); // Queue for file processing (image thumbnails)

// Process the queue
fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!userId) throw new Error('Missing userId');
  if (!fileId) throw new Error('Missing fileId');

  // Find file in DB
  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId });
  if (!file) throw new Error('File not found');

  if (file.type !== 'image') throw new Error('File is not an image');

  const sizes = [500, 250, 100]; // Define sizes for thumbnails
  const filePath = file.localPath;
  
  // Generate thumbnails and save them
  for (const size of sizes) {
    const thumbnailPath = path.join(path.dirname(filePath), `${path.basename(filePath)}_${size}`);
    const options = { width: size };
    const thumbnail = await imageThumbnail(filePath, options);
    fs.writeFileSync(thumbnailPath, thumbnail);
  }
});

export { fileQueue };

