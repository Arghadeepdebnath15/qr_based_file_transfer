# QR-Based File Transfer System

A MERN stack application that enables secure file transfers using QR codes.

## Features

- User authentication
- File upload and download
- QR code generation for file sharing
- Real-time file transfer status
- Secure file storage

## Tech Stack

- MongoDB
- Express.js
- React.js
- Node.js
- Socket.IO
- Multer for file handling
- JWT for authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Arghadeepdebnath15/qr_based_file_transfer.git
cd qr_based_file_transfer
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
```

4. Create a .env file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

5. Start the development server:
```bash
# Start backend server
npm run dev

# In a new terminal, start frontend
cd client
npm start
```

## Deployment

The application is configured for deployment on:
- Frontend: Netlify
- Backend: Render

## License

ISC 