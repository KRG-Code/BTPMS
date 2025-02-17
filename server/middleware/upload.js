// upload.js
const express = require('express');
const multer = require('multer');
const { bucket } = require('../config/firebaseAdmin'); // Ensure this path is correct

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToFirebase = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const blob = bucket.file(Date.now() + req.file.originalname);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });

    blobStream.on('error', (err) => {
        console.error('Upload Error:', err);
        return res.status(500).send({ message: err.message });
    });

    blobStream.on('finish', () => {
        req.file.firebaseUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        next();
    });

    blobStream.end(req.file.buffer);
};

module.exports = {
    upload: upload.single('image'), // Adjust 'image' to your actual field name
    uploadToFirebase,
};
