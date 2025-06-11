import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    publicUploadToken: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(32).toString('hex')
    },
    receiveToken: {
        type: String,
        unique: true,
        sparse: true,
        default: () => crypto.randomBytes(32).toString('hex')
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Generate tokens if not present
userSchema.pre('save', function(next) {
    if (!this.publicUploadToken) {
        this.publicUploadToken = crypto.randomBytes(32).toString('hex');
    }
    if (!this.receiveToken) {
        this.receiveToken = crypto.randomBytes(32).toString('hex');
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

export default User; 