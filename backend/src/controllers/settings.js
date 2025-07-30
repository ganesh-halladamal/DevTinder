const User = require('../models/user');

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('settings emailNotifications showProfile distance experience availability');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {
        emailNotifications: true,
        showProfile: true,
        distance: 75,
        experience: 'senior',
        availability: 'full-time',
        theme: 'light' // Keep theme for backward compatibility
      };
      await user.save();
    }

    // Return settings without theme as it's handled separately
    const { theme, ...settingsWithoutTheme } = user.settings;
    
    res.json({
      settings: settingsWithoutTheme
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      message: 'Error fetching settings'
    });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const { emailNotifications, showProfile, distance, experience, availability } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'settings.emailNotifications': emailNotifications,
          'settings.showProfile': showProfile,
          'settings.distance': distance,
          'settings.experience': experience,
          'settings.availability': availability
        }
      },
      { new: true, runValidators: true }
    ).select('settings');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Return settings without theme
    const { theme, ...settingsWithoutTheme } = user.settings;
    
    res.json({
      message: 'Settings updated successfully',
      settings: settingsWithoutTheme
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      message: 'Error updating settings'
    });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      message: 'Error deleting account'
    });
  }
};