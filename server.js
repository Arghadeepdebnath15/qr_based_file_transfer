import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Test route
app.get('/api/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'Server is working' });
});

// Serve QR upload page
app.get('/qr-upload/:token', (req, res) => {
    console.log('QR upload page requested for token:', req.params.token);
    res.sendFile(path.join(__dirname, 'public', 'qr-upload.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({ message: 'Not Found' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/file-storage';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Available routes:');
            console.log('- GET  /api/test');
            console.log('- POST /api/auth/register');
            console.log('- POST /api/auth/login');
            console.log('- GET  /api/auth/profile');
            console.log('- GET  /api/files/test');
            console.log('- GET  /api/files/receive-qr');
            console.log('- POST /api/files/upload-via-qr/:receiveToken');
            console.log('- GET  /api/files/my-files');
            console.log('- GET  /api/files/download/:fileId');
            console.log('- DELETE /api/files/delete/:fileId');
            console.log('- GET  /qr-upload/:token');
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }); 