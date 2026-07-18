const prisma = require('../config/db');

const getSettings = async (req, res, next) => {
  try {
    const dbSettings = await prisma.siteSettings.findMany();
    
    // Format as a simple key-value object for easy use on frontend
    const settings = {};
    dbSettings.forEach((s) => {
      settings[s.key] = s.value;
    });

    res.json({
      success: true,
      settings,
      raw: dbSettings,
    });
  } catch (error) {
    next(error);
  }
};

const getSettingsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const dbSettings = await prisma.siteSettings.findMany({
      where: { category },
    });

    const settings = {};
    dbSettings.forEach((s) => {
      settings[s.key] = s.value;
    });

    res.json({
      success: true,
      category,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'Value is required' });
    }

    const setting = await prisma.siteSettings.update({
      where: { key },
      data: { value: String(value) },
    });

    res.json({
      success: true,
      setting,
    });
  } catch (error) {
    next(error);
  }
};

const createSetting = async (req, res, next) => {
  try {
    const { key, value, type, category, label } = req.body;

    const setting = await prisma.siteSettings.create({
      data: {
        key,
        value: String(value),
        type: type || 'text',
        category: category || 'general',
        label: label || key,
      },
    });

    res.status(201).json({
      success: true,
      setting,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  getSettingsByCategory,
  updateSetting,
  createSetting,
};
