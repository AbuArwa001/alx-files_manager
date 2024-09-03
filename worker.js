import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import path from 'path';
import fs from 'fs';
import dbClient from './utils/db';
import { log } from 'console';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Retrieve the file from DB based on fileId and userId
  const file = await dbClient.getFileById(fileId, userId);
  if (!file) {
    throw new Error('File not found');
  }

  // Generate thumbnails
  const filePath = path.resolve(__dirname, file.localPath);
  console.log(`Processing file: ${filePath}`);
  const sizes = [500, 250, 100];

  await Promise.all(sizes.map(async (width) => {
    const thumbnail = await imageThumbnail(filePath, { width });
    const thumbnailPath = filePath.concat(`_${width}`);
    console.log(`Writing thumbnail to: ${thumbnailPath}`);
    fs.writeFileSync(thumbnailPath, thumbnail);
  }));
});
