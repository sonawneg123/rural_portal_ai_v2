// src/config/s3.js
const { S3Client } = require('@aws-sdk/client-s3');
const multer       = require('multer');
const multerS3     = require('multer-s3');
const { v4: uuid } = require('uuid');
const path         = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif'];

const makeUpload = (folder = 'problems', maxFiles = 5) =>
  multer({
    storage: multerS3({
      s3,
      bucket: process.env.S3_BUCKET_NAME,
      acl:    'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${folder}/${Date.now()}-${uuid()}${ext}`);
      },
    }),
    limits:     { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Only JPEG, PNG, WEBP, GIF allowed'));
    },
  });

const uploadProblem = makeUpload('problems', 5).array('photos', 5);
const uploadWork    = makeUpload('work-updates', 5).array('photos', 5);

module.exports = { s3, uploadProblem, uploadWork };
