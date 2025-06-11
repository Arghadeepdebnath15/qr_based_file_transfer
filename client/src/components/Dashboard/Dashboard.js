import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Box,
    CircularProgress,
    AppBar,
    Toolbar,
    Snackbar,
    Alert,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Delete as DeleteIcon, Download as DownloadIcon, Logout as LogoutIcon, QrCode as QrCodeIcon, ContentCopy as ContentCopyIcon, QrCode2 as QrCode2Icon } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [qrDialogOpen, setQrDialogOpen] = useState(false);
    const [receiveQrDialogOpen, setReceiveQrDialogOpen] = useState(false);
    const [receiveToken, setReceiveToken] = useState('');
    const navigate = useNavigate();

    const fetchFiles = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Check if token is valid by making a test request
            try {
                await axios.get('http://localhost:5000/api/files/my-files', {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                if (error.response?.status === 401) {
                    // Token is invalid or expired
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    navigate('/login');
                    return;
                }
                throw error; // Re-throw other errors
            }

            const response = await axios.get('http://localhost:5000/api/files/my-files', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFiles(response.data);
        } catch (error) {
            setError('Error fetching files');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleFileUpload = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        // Check if any file exceeds 200MB
        const oversizedFiles = selectedFiles.filter(file => file.size > 200 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            setError(`Files exceeding 200MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
            return;
        }

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const token = localStorage.getItem('token');
            setUploadProgress(0);
            
            const response = await axios.post('http://localhost:5000/api/files/upload', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            
            console.log('Upload response:', response.data);
            setSuccess(`${selectedFiles.length} file(s) uploaded successfully!`);
            fetchFiles();
        } catch (error) {
            console.error('Upload error:', error);
            setError('Error uploading files');
        } finally {
            setUploadProgress(0);
        }
    };

    const handleDownload = async (fileId, filename) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/files/download/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setSuccess('File downloaded successfully!');
        } catch (error) {
            setError('Error downloading file');
        }
    };

    const handleDelete = async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/files/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('File deleted successfully!');
            fetchFiles();
        } catch (error) {
            setError('Error deleting file');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    const handleShowQR = (file) => {
        if (!file || !file.accessToken) {
            console.error('Invalid file data:', file);
            setError('Invalid file data');
            return;
        }
        console.log('Showing QR for file:', file);
        setSelectedFile(file);
        setQrDialogOpen(true);
    };

    const getPublicUrl = (accessToken) => {
        if (!accessToken) {
            console.error('No access token provided');
            return '';
        }
        const serverIP = 'localhost'; // Changed from hardcoded IP to localhost
        const port = '5000';
        const url = `http://${serverIP}:${port}/api/files/public/${accessToken}`;
        console.log('Generated public URL:', url);
        return url;
    };

    const handleCopyLink = (accessToken) => {
        const url = getPublicUrl(accessToken);
        navigator.clipboard.writeText(url)
            .then(() => setSuccess('Link copied to clipboard!'))
            .catch(() => setError('Failed to copy link'));
    };

    const handleShowReceiveQR = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found in localStorage');
                setError('Please log in again');
                navigate('/login');
                return;
            }

            // First test if the file routes are working
            try {
                const testResponse = await axios.get('http://localhost:5000/api/files/test');
                console.log('File routes test:', testResponse.data);
            } catch (error) {
                console.error('File routes test failed:', error);
                setError('Server connection error. Please try again.');
                return;
            }

            console.log('Fetching receive QR with token:', token);
            const response = await axios.get('http://localhost:5000/api/files/receive-qr', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Receive QR response:', response.data);
            if (!response.data.receiveToken) {
                throw new Error('No receive token in response');
            }

            setReceiveToken(response.data.receiveToken);
            setReceiveQrDialogOpen(true);
        } catch (error) {
            console.error('Error getting receive QR:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                setError(error.response.data.message || 'Error getting receive QR code');
            } else if (error.request) {
                console.error('No response received:', error.request);
                setError('No response from server. Please check your connection.');
            } else {
                console.error('Error message:', error.message);
                setError(error.message || 'Error getting receive QR code');
            }
        }
    };

    const getReceiveUrl = () => {
        const serverIP = 'localhost'; // Changed from hardcoded IP to localhost
        const port = '5000';
        return `http://${serverIP}:${port}/qr-upload/${receiveToken}`;
    };

    const handleCopyReceiveLink = () => {
        const url = getReceiveUrl();
        navigator.clipboard.writeText(url)
            .then(() => setSuccess('Link copied to clipboard!'))
            .catch(() => setError('Failed to copy link'));
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        File Storage
                    </Typography>
                    <Button 
                        color="inherit" 
                        onClick={handleShowReceiveQR}
                        sx={{ mr: 2 }}
                    >
                        <QrCode2Icon sx={{ mr: 1 }} />
                        Receive Files
                    </Button>
                    <Button color="inherit" onClick={handleLogout}>
                        <LogoutIcon sx={{ mr: 1 }} />
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Upload Files
                    </Typography>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="file-upload"
                    />
                    <label htmlFor="file-upload">
                        <Button
                            variant="contained"
                            component="span"
                            sx={{ mr: 2 }}
                        >
                            Select Files
                        </Button>
                    </label>
                    {uploadProgress > 0 && (
                        <Box sx={{ width: '100%', mt: 2 }}>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                            <Typography variant="body2" color="text.secondary" align="center">
                                {uploadProgress}%
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        My Files
                    </Typography>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : files.length === 0 ? (
                        <Typography variant="body1" color="text.secondary" align="center">
                            No files uploaded yet
                        </Typography>
                    ) : (
                        <List>
                            {files.map((file) => (
                                <ListItem key={file._id}>
                                    <ListItemText
                                        primary={file.filename}
                                        secondary={`Size: ${formatFileSize(file.size)}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label="download"
                                            onClick={() => handleDownload(file._id, file.originalName)}
                                            sx={{ mr: 1 }}
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            aria-label="share"
                                            onClick={() => handleShowQR(file)}
                                            sx={{ mr: 1 }}
                                        >
                                            <QrCodeIcon />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => handleDelete(file._id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            </Container>

            <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
                <DialogTitle>Share File</DialogTitle>
                <DialogContent>
                    {selectedFile && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                            <QRCodeSVG value={getPublicUrl(selectedFile.accessToken)} size={200} />
                            <Typography variant="body2" sx={{ mt: 2, wordBreak: 'break-all' }}>
                                {getPublicUrl(selectedFile.accessToken)}
                            </Typography>
                            <Button
                                startIcon={<ContentCopyIcon />}
                                onClick={() => handleCopyLink(selectedFile.accessToken)}
                                sx={{ mt: 2 }}
                            >
                                Copy Link
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={receiveQrDialogOpen} onClose={() => setReceiveQrDialogOpen(false)}>
                <DialogTitle>Receive Files</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            Scan this QR code to send files to your account
                        </Typography>
                        <QRCodeSVG value={getReceiveUrl()} size={200} />
                        <Typography variant="body2" sx={{ mt: 2, wordBreak: 'break-all' }}>
                            {getReceiveUrl()}
                        </Typography>
                        <Button
                            startIcon={<ContentCopyIcon />}
                            onClick={handleCopyReceiveLink}
                            sx={{ mt: 2 }}
                        >
                            Copy Link
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReceiveQrDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Dashboard; 