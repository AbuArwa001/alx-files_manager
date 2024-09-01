# 0x04. Files Manager

This project is a culmination of the back-end trimester, combining topics such as authentication, Node.js, MongoDB, Redis, pagination, and background processing. The goal is to build a simple platform to upload and view files with the following features:

- User authentication via a token
- List all files
- Upload a new file
- Change permission of a file
- View a file
- Generate thumbnails for images

You will be guided step by step to build this platform, but you have some freedom in implementation, including file organization (consider using a `utils` folder).

This project simulates a real-world service for learning purposes, allowing you to assemble various components into a complete product.

**Enjoy!**

## Resources

Read or watch:

- Node.js getting started
- Process API doc
- Express getting started
- Mocha documentation
- Nodemon documentation
- MongoDB
- Bull
- Image thumbnail
- Mime-Types
- Redis

## Learning Objectives

By the end of this project, you should be able to explain the following without using Google:

- How to create an API with Express
- How to authenticate a user
- How to store data in MongoDB
- How to store temporary data in Redis
- How to set up and use a background worker

## Requirements

- Allowed editors: `vi`, `vim`, `emacs`, `Visual Studio Code`
- All files will be interpreted/compiled on Ubuntu 18.04 LTS using Node.js (version 12.x.x)
- All files should end with a new line
- A `README.md` file at the root of the project folder is mandatory
- Your code should use the `.js` extension
- Your code will be verified against lint using ESLint

## Provided Files

Make sure to run `$ npm install` after you have the `package.json`.

## Tasks

### 0. Redis Utils

Create a file `redis.js` inside the `utils` folder containing the `RedisClient` class. This class should have the following:

- Constructor that creates a client to Redis and handles errors.
- `isAlive()` method to check if the Redis connection is successful.
- `get()` method to retrieve a value by key.
- `set()` method to store a value by key with an expiration.
- `del()` method to delete a value by key.

Example usage:

```javascript
import redisClient from "./utils/redis";

(async () => {
  console.log(redisClient.isAlive());
  console.log(await redisClient.get("myKey"));
  await redisClient.set("myKey", 12, 5);
  console.log(await redisClient.get("myKey"));

  setTimeout(async () => {
    console.log(await redisClient.get("myKey"));
  }, 1000 * 10);
})();
```
