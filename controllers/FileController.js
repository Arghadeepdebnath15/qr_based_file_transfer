const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Get base URL based on environment
const getBaseUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL || 'https://qr-based-file-transfer.onrender.com'
        : 'http://localhost:5000';
};

// Generate QR code for file upload
exports.generateQR = async (req, res) => {
    try {
        const receiveToken = uuidv4();
        const qrData = `${getBaseUrl()}/qr-upload/${receiveToken}`;
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(qrData);
        
        res.json({
            qrCode,
            receiveToken,
            uploadUrl: qrData
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ message: 'Error generating QR code' });
    }
};

// Upload files via QR
exports.uploadViaQR = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No files were uploaded' });
        }

        const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
        const uploadedFiles = [];

        for (const file of files) {
            const fileName = file.name;
            const filePath = path.join(__dirname, '../uploads', fileName);

            await file.mv(filePath);

            const newFile = new File({
                fileName,
                filePath,
                receiveToken: req.params.token,
                uploadDate: new Date()
            });

            await newFile.save();
            uploadedFiles.push(newFile);
        }

        res.json({ message: 'Files uploaded successfully', files: uploadedFiles });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ message: 'Error uploading files' });
    }
};

// Get files by receive token
exports.getFilesByToken = async (req, res) => {
    try {
        const files = await File.find({ receiveToken: req.params.token });
        res.json(files);
    } catch (error) {
        console.error('Error getting files:', error);
        res.status(500).json({ message: 'Error getting files' });
    }
};

// Delete file
exports.deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete file from filesystem
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        await File.findByIdAndDelete(req.params.id);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
}; 