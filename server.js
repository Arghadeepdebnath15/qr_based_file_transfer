import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
    dotenv.config();
} else {
    dotenv.config({ path: '.env.development' });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL 
        : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Debug middleware - only in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Serve QR upload page
app.get('/qr-upload/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qr-upload.html'));
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from the React build directory
    app.use(express.static(path.join(__dirname, 'client/build')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
} else {
    // Serve static files from public directory in development
    app.use(express.static(path.join(__dirname, 'public')));
}

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
    res.status(404).json({ message: 'Not Found' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
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