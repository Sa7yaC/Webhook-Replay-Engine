import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '15min'
    });
}
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: '7d'
    });
}