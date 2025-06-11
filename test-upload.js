import mongoose from 'mongoose';
import User from './models/User.js';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpload() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/file-storage', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create test user
        const testUser = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await testUser.save();
        console.log('Test user created:', testUser);

        // Get receive token
        const receiveToken = testUser.receiveToken;
        console.log('Receive token:', receiveToken);

        // Create test file
        const testFilePath = path.join(__dirname, 'test.txt');
        fs.writeFileSync(testFilePath, 'This is a test file');

        // Create form data
        const form = new FormData();
        form.append('files', fs.createReadStream(testFilePath));

        // Upload file
        const response = await fetch(`http://localhost:5000/api/files/upload-via-qr/${receiveToken}`, {
            method: 'POST',
            body: form
        });

        const result = await response.json();
        console.log('Upload result:', result);

        // Clean up
        fs.unlinkSync(testFilePath);
        await mongoose.connection.close();
        console.log('Test completed');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testUpload(); 