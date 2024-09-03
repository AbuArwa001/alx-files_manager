import fs from 'fs';
import { v4 as uuid4 } from 'uuid'; // Import the 'v4' function from the 'uuid' library

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const mime = require('mime-types');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['X-Token'];
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
        parentId,
        isPublic,
      };
      if (parentId) {
        const parent = await dbClient.getFile(parentId);
        if (!parent || parent.type !== 'folder') {
          return res.status(400).json({ error: 'Parent not found or not a folder' });
        }
      }

      if (type === 'folder') {
        const newFolder = await dbClient.createFile({
          userId, name, type, parentId, isPublic,
        });
        return res.status(201).json({ ...fileDocument, id: newFolder.insertedId });
      }

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      fs.writeFileSync(localPath, data, 'base64');

      const newFile = await dbClient.createFile({
        userId, name, type, parentId, isPublic, localPath,
      });
      return res.status(201).json({ ...fileDocument, id: newFile.insertedId });
    } catch (error) {
      console.error('Error creating new file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    const token = req.headers['X-Token'];
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const file = await dbClient.getFile(id);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json({ id: file._id, ...file });
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    const token = req.headers['X-Token'];
    const { parentId, page } = req.query;

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
    const token = req.headers['X-Token'];
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const file = await dbClient.getFile(id);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      await dbClient.publishFile(id);
      return res.status(200).json({ id: file._id, ...file, isPublic: true });
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    const token = req.headers['X-Token'];
    const { id } = req.params;
    console.log(token);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const file = await dbClient.getFile(id);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      await dbClient.unpublishFile(id);
      return res.status(200).json({ id: file._id, ...file, isPublic: false });
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getFile(req, res) {
    const token = req.headers['X-Token'];
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
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
      if (!fs.existsSync(file.localPath)) {
        return res.status(404).json({ error: 'Not found' });
      }
      const data = fs.readFileSync(file.localPath);
      const mimeType = mime.lookup(file.name);
      return res.status(200).send(data).set('Content-Type', mimeType);
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
