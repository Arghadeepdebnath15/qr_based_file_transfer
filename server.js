import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import dotenv from 'dotenv';
import fs from 'fs';

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
        ? [process.env.CLIENT_URL, 'https://*.netlify.app']
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

// API Routes
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
    const qrUploadPath = path.join(__dirname, 'public', 'qr-upload.html');
    console.log('Attempting to serve QR upload page from:', qrUploadPath);
    
    if (fs.existsSync(qrUploadPath)) {
        res.sendFile(qrUploadPath);
    } else {
        console.error('QR upload page not found at:', qrUploadPath);
        res.status(404).json({ message: 'QR upload page not found' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle React routing in production
if (process.env.NODE_ENV === 'production') {
    // Serve index.html for all routes
    app.get('*', (req, res) => {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        console.log('Attempting to serve index.html from:', indexPath);
        
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            // If index.html doesn't exist, create a basic one
            const basicHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>QR File Transfer</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .container { max-width: 800px; margin: 0 auto; text-align: center; }
                        h1 { color: #333; }
                        p { color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>QR File Transfer</h1>
                        <p>Welcome to the QR File Transfer application.</p>
                        <p>Please try again in a few moments as we're setting up the application.</p>
                    </div>
                </body>
                </html>
            `;
            
            // Create the public directory if it doesn't exist
            if (!fs.existsSync(path.join(__dirname, 'public'))) {
                fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
            }
            
            // Write the basic HTML file
            fs.writeFileSync(indexPath, basicHtml);
            res.sendFile(indexPath);
        }
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log('Current directory:', __dirname);
            console.log('Public directory contents:', fs.readdirSync(path.join(__dirname, 'public')));
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