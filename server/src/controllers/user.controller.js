const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
    });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email, avatar, password } = req.body;

    const data = {};
    if (name) data.name = name;
    if (avatar) data.avatar = avatar;

    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email address already in use' });
      }
      data.email = email;
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
      data.refreshToken = null; // Revoke refresh tokens on password change
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      wishlist: wishlist.map((item) => item.product),
    });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      return res.json({ success: true, message: 'Product already in wishlist' });
    }

    await prisma.wishlist.create({
      data: { userId, productId },
    });

    res.json({
      success: true,
      message: 'Product added to wishlist',
    });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await prisma.wishlist.delete({
      where: {
        userId_productId: { userId, productId },
      },
    });

    res.json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    next(error);
  }
};

const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, addresses });
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, street, city, state, zipCode, country, phone, isDefault } = req.body;

    if (isDefault) {
      // Set all other user addresses to default = false
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // If this is the user's first address, make it default automatically
    const count = await prisma.address.count({ where: { userId } });
    const finalDefault = count === 0 ? true : !!isDefault;

    const address = await prisma.address.create({
      data: {
        userId,
        fullName,
        street,
        city,
        state,
        zipCode,
        country: country || 'IN',
        phone,
        isDefault: finalDefault,
      },
    });

    res.status(201).json({
      success: true,
      address,
    });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { fullName, street, city, state, zipCode, country, phone, isDefault } = req.body;

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (isDefault && !existing.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        fullName,
        street,
        city,
        state,
        zipCode,
        country,
        phone,
        isDefault: isDefault !== undefined ? !!isDefault : existing.isDefault,
      },
    });

    res.json({
      success: true,
      address,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await prisma.address.delete({ where: { id } });

    // If we deleted the default address, set another one as default
    if (existing.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsersAdmin = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isBlocked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserBlockAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect against self-blocking
    if (targetUser.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Administrators cannot block their own sessions.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: !targetUser.isBlocked,
        refreshToken: null, // Force logouts immediately upon blocking
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
      },
    });

    res.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getAllUsersAdmin,
  toggleUserBlockAdmin,
};
