const User = require('../models/user');

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('settings emailNotifications pushNotifications showProfile distance experience availability theme');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {
        emailNotifications: true,
        pushNotifications: false,
        showProfile: true,
        distance: 75,
        experience: 'senior',
        availability: 'full-time',
        theme: 'light'
      };
      await user.save();
    }

    res.json({
      settings: user.settings
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
    const { emailNotifications, pushNotifications, showProfile, distance, experience, availability, theme } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'settings.emailNotifications': emailNotifications,
          'settings.pushNotifications': pushNotifications,
          'settings.showProfile': showProfile,
          'settings.distance': distance,
          'settings.experience': experience,
          'settings.availability': availability,
          'settings.theme': theme
        }
      },
      { new: true, runValidators: true }
    ).select('settings');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
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