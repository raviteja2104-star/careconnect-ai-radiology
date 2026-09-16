const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 100MB.',
        });
    }

    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: messages.join(', '),
        });
    }

    // Mongoose CastError (invalid ObjectId format)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format.',
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value entered.',
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token.',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired.',
        });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const statusCode = err.statusCode || 500;
    const message = (isProd && statusCode >= 500)
        ? 'Internal Server Error'
        : (err.message || 'Internal Server Error');
    // Only log the real error server-side
    if (isProd && statusCode >= 500) console.error('Internal error:', err);
    res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
