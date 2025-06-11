import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Test route
router.get('/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'File routes are working' });
});

// Regular file upload
router.post('/upload', auth, upload.array('files'), async (req, res) => {
    try {
        console.log('Upload route hit by user:', req.user.id);
        console.log('Files received:', req.files);

        if (!req.files || req.files.length === 0) {
            console.log('No files uploaded');
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const savedFiles = [];
        for (const file of req.files) {
            console.log('Processing file:', file.originalname);
            const fileData = fs.readFileSync(file.path);
            
            const newFile = new File({
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                data: fileData,
                owner: req.user.id,
                accessToken: Math.random().toString(36).substring(2, 15)
            });

            await newFile.save();
            savedFiles.push({
                id: newFile._id,
                name: newFile.originalName,
                size: newFile.size,
                accessToken: newFile.accessToken
            });

            // Clean up temporary file
            fs.unlinkSync(file.path);
        }

        console.log('Files saved successfully');
        res.status(201).json({
            message: 'Files uploaded successfully',
            files: savedFiles
        });
    } catch (error) {
        console.error('Error in upload route:', error);
        // Clean up any temporary files in case of error
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ message: 'Error uploading files' });
    }
});

// Receive QR code
router.get('/receive-qr', auth, async (req, res) => {
    try {
        console.log('Receive QR route hit by user:', req.user.id);
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('Sending receive token');
        res.json({ receiveToken: user.receiveToken });
    } catch (error) {
        console.error('Error in receive-qr route:', error);
        res.status(500).json({ message: 'Error generating QR code' });
    }
});

// Upload via QR
router.post('/upload-via-qr/:receiveToken', upload.array('files'), async (req, res) => {
    try {
        console.log('Upload via QR route hit with token:', req.params.receiveToken);
        console.log('Files received:', req.files);

        if (!req.files || req.files.length === 0) {
            console.log('No files uploaded');
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const user = await User.findOne({ receiveToken: req.params.receiveToken });
        if (!user) {
            console.log('User not found for token');
            return res.status(404).json({ message: 'Invalid receive token' });
        }

        const savedFiles = [];
        for (const file of req.files) {
            console.log('Processing file:', file.originalname);
            const fileData = fs.readFileSync(file.path);
            
            const newFile = new File({
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                data: fileData,
                owner: user._id,
                accessToken: Math.random().toString(36).substring(2, 15)
            });

            await newFile.save();
            savedFiles.push({
                id: newFile._id,
                name: newFile.originalName,
                size: newFile.size,
                accessToken: newFile.accessToken
            });

            // Clean up temporary file
            fs.unlinkSync(file.path);
        }

        console.log('Files saved successfully');
        res.status(201).json({
            message: 'Files uploaded successfully',
            files: savedFiles
        });
    } catch (error) {
        console.error('Error in upload-via-qr route:', error);
        // Clean up any temporary files in case of error
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ message: 'Error uploading files' });
    }
});

// Get user's files
router.get('/my-files', auth, async (req, res) => {
    try {
        console.log('My files route hit by user:', req.user.id);
        const files = await File.find({ owner: req.user.id })
            .select('originalName mimeType size createdAt accessToken');
        console.log('Found files:', files.length);
        res.json(files);
    } catch (error) {
        console.error('Error in my-files route:', error);
        res.status(500).json({ message: 'Error fetching files' });
    }
});

// Download file
router.get('/download/:fileId', auth, async (req, res) => {
    try {
        console.log('Download route hit for file:', req.params.fileId);
        const file = await File.findOne({
            _id: req.params.fileId,
            owner: req.user.id
        });

        if (!file) {
            console.log('File not found or unauthorized');
            return res.status(404).json({ message: 'File not found' });
        }

        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.send(file.data);
    } catch (error) {
        console.error('Error in download route:', error);
        res.status(500).json({ message: 'Error downloading file' });
    }
});

// Delete file
router.delete('/delete/:fileId', auth, async (req, res) => {
    try {
        console.log('Delete route hit for file:', req.params.fileId);
        const file = await File.findOneAndDelete({
            _id: req.params.fileId,
            owner: req.user.id
        });

        if (!file) {
            console.log('File not found or unauthorized');
            return res.status(404).json({ message: 'File not found' });
        }

        console.log('File deleted successfully');
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error in delete route:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

// Public file access
router.get('/public/:accessToken', async (req, res) => {
    try {
        console.log('Public access route hit for token:', req.params.accessToken);
        const file = await File.findOne({ accessToken: req.params.accessToken });

        if (!file) {
            console.log('File not found for token');
            return res.status(404).json({ message: 'File not found' });
        }

        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.send(file.data);
    } catch (error) {
        console.error('Error in public access route:', error);
        res.status(500).json({ message: 'Error accessing file' });
    }
});

export default router; 