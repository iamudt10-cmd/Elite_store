const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokens');
const emailService = require('../services/email.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if it's the very first user; make them ADMIN if so
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      user,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    const accessToken = generateAccessToken(userResponse);
    const refreshToken = generateRefreshToken(userResponse);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: userResponse,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtRefreshSecret);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    const newAccessToken = generateAccessToken(userResponse);
    const newRefreshToken = generateRefreshToken(userResponse);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak registered accounts, return true
      return res.json({ success: true, message: 'If the email exists, a password reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    });

    const resetLink = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;
    
    await emailService.sendEmail({
      to: user.email,
      subject: 'Elite Style Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #8b5cf6; text-align: center;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password for your <strong>Elite Style</strong> account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
        refreshToken: null, // Revoke refresh tokens on password change
      },
    });

    res.json({ success: true, message: 'Password has been successfully updated' });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID Token is required' });
    }

    // Verify token with Google's public token info endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const tokenInfo = await response.json();

    if (tokenInfo.error || !tokenInfo.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google ID Token' });
    }

    // Google client ID verification (if configured)
    if (config.googleClientId && tokenInfo.aud !== config.googleClientId) {
      return res.status(400).json({ success: false, message: 'Token audience does not match Client ID' });
    }

    const { email, name, picture, email_verified } = tokenInfo;
    const isEmailVerified = email_verified === 'true' || email_verified === true;

    if (!isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Google email is not verified' });
    }

    // Check if user exists, else create new user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Very first user is ADMIN, else USER
      const userCount = await prisma.user.count();
      const role = userCount === 0 ? 'ADMIN' : 'USER';
      
      // Random password since they login with Google
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email,
          password: hashedPassword,
          role,
          avatar: picture || '',
        }
      });
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    const accessToken = generateAccessToken(userResponse);
    const refreshToken = generateRefreshToken(userResponse);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: userResponse,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleLogin,
};
