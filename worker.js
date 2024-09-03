import Bull from 'bull';
import path from 'path';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const userQueue = new Bull('userQueue');

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Retrieve the user from DB based on userId
  const user = await dbClient.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Simulate sending a welcome email
  console.log(`Welcome ${user.email}!`);
});

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
