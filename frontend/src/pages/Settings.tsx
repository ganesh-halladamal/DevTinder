import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { settingsAPI } from '../services/api';
import { Settings as SettingsIcon, Bell, Shield, User, LogOut, Trash2, Moon, Sun } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    showProfile: true,
    distance: 75,
    experience: 'senior',
    availability: 'full-time',
    theme: 'light'
  });

  const experienceLevels = ['beginner', 'intermediate', 'senior'];
  const availabilityOptions = ['full-time', 'part-time', 'freelance', 'weekends'];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsAPI.getSettings();
      const userSettings = (response as any).data.settings;
      
      // Ensure theme matches the theme context
      if (userSettings.theme && userSettings.theme !== theme) {
        const themeContext = require('../context/ThemeContext');
        if (themeContext.useTheme) {
          // Update theme context to match user preference
          // Note: This is a workaround for the theme sync issue
          localStorage.setItem('theme', userSettings.theme);
          window.location.reload(); // Force reload to apply theme
        }
      }
      
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: boolean | string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setMessage('');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Ensure theme is synchronized
      const saveData = {
        ...settings,
        theme: theme // Use current theme from context
      };
      
      await settingsAPI.updateSettings(saveData);
      setMessage('Settings saved successfully!');
      
      // Update local storage to match
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Save settings error:', error);
      setMessage(`Failed to save settings: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await settingsAPI.deleteAccount();
        logout();
      } catch (error) {
        setMessage('Failed to delete account');
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-purple-100 mt-1">Manage your preferences and account</p>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-purple-600" />
              Notifications
            </h3>
            
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
              <span className="font-medium">Email Notifications</span>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="h-5 w-5 text-purple-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
              <span className="font-medium">Push Notifications</span>
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                className="h-5 w-5 text-purple-600 rounded"
              />
            </label>
          </div>

          {/* Discovery Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Discovery Preferences
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Distance (km)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={settings.distance}
                  onChange={(e) => handleSettingChange('distance', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-600">{settings.distance} km</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              <select
                value={settings.experience}
                onChange={(e) => handleSettingChange('experience', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {experienceLevels.map(level => (
                  <option key={level} value={level} className="capitalize">
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <select
                value={settings.availability}
                onChange={(e) => handleSettingChange('availability', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {availabilityOptions.map(option => (
                  <option key={option} value={option} className="capitalize">
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              {theme === 'dark' ? <Moon className="h-5 w-5 mr-2 text-purple-600" /> : <Sun className="h-5 w-5 mr-2 text-purple-600" />}
              Theme
            </h3>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
              <span className="font-medium">Dark Mode</span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Privacy
            </h3>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
              <span className="font-medium">Show Profile to Others</span>
              <input
                type="checkbox"
                checked={settings.showProfile}
                onChange={(e) => handleSettingChange('showProfile', e.target.checked)}
                className="h-5 w-5 text-purple-600 rounded"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>

            <button
              onClick={() => logout()}
              className="w-full bg-red-50 text-red-600 py-3 px-4 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;