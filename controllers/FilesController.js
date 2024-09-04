import fs from 'fs';
import { v4 as uuid4 } from 'uuid'; // Import the 'v4' function from the 'uuid' library

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const mime = require('mime-types');
const Bull = require('bull');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = `${folderPath}/${uuid4()}`;
    const {
      name, type, parentId, isPublic = false, data,
    } = req.body;

    try {
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      const fileDocument = {
        userId,
        name,
        type,
        parentId: parentId || 0,
        isPublic,
        localPath,
      };

      if (fileDocument.parentId !== 0) {
        const parent = await dbClient.getFile(fileDocument.parentId);
        if (!parent || parent.type !== 'folder') {
          return res.status(400).json({ error: 'Parent not found or not a folder' });
        }
      }

      if (type === 'folder') {
        const newFolder = await dbClient.createFile({ ...fileDocument });
        return res.status(201).json({ ...fileDocument, id: newFolder.insertedId });
      }

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      fs.writeFileSync(localPath, data, 'base64');

      const newFile = await dbClient.createFile({ ...fileDocument });

      // Start background processing for generating thumbnails if the type is 'image'
      if (type === 'image') {
        const fileQueue = new Bull('fileQueue');
        await fileQueue.add({ userId, fileId: newFile.insertedId });
      }

      return res.status(201).json({ ...fileDocument, id: newFile.insertedId });
    } catch (error) {
      console.error('Error creating new file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const file = await dbClient.getFile(id);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json({
        id: file._id, ...file, _id: undefined, localPath: undefined,
      });
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const { parentId = 0, page } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const files = await dbClient.getFiles(parentId, page);
      return res.status(200).json(files);
    } catch (error) {
      console.error('Error getting files:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    const user = await dbClient.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const file = await dbClient.getFileById(id, userId);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      await dbClient.publishFile(id);
      return res.status(200).json({
        id: file._id, ...file, _id: undefined, localPath: undefined,
      });
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('token', token);
    try {
      const userId = await redisClient.get(`auth_${token}`);
      const user = await dbClient.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const file = await dbClient.getFileById(id, userId);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      await dbClient.unpublishFile(id);
      return res.status(200).json({
        id: file._id, ...file, _id: undefined, localPath: undefined,
      });
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;
    const { size } = req.query; // Get the size query parameter

    try {
      const file = await dbClient.getFile(id);

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (file.isPublic === false && file.userId !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (file.type === 'folder') {
        return res.status(400).json({ error: 'A folder doesn\'t have content' });
      }

      // Determine the file path based on size
      let filePath = file.localPath;
      if (size && ['100', '250', '500'].includes(size)) {
        const sizeFilePath = `${file.localPath}_${size}`;
        if (fs.existsSync(sizeFilePath)) {
          filePath = sizeFilePath;
        } else {
          return res.status(404).json({ error: 'Not found' });
        }
      } else if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const data = fs.readFileSync(filePath);
      const mimeType = mime.contentType(file.name);
      // const mimeType = mime.lookup(file.name);
      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(404).send({ error: 'Not found' });
    }
  }
}

export default FilesController;
