const config = {
    apiUrl: process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL
        : 'http://localhost:5000',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL
        : 'http://localhost:5000'
};

export default config; 