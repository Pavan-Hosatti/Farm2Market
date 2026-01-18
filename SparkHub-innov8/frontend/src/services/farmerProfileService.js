import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ✅ Helper to get auth headers (matches your existing auth system)
const getAuthHeaders = (token) => ({
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get current farmer's profile
export const getMyProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/farmer-profile/me`, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// Create or update profile
export const updateProfile = async (profileData, token) => {
  try {
    const response = await axios.put(`${API_URL}/farmer-profile`, profileData, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Get public profile by ID
export const getProfileById = async (profileId) => {
  try {
    const response = await axios.get(`${API_URL}/farmer-profile/${profileId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    throw error;
  }
};

// Search farmers by location
export const searchFarmersByLocation = async (location) => {
  try {
    const response = await axios.get(`${API_URL}/farmer-profile/search/${location}`);
    return response.data;
  } catch (error) {
    console.error('Error searching farmers:', error);
    throw error;
  }
};

// Update statistics
export const updateStats = async (stats, token) => {
  try {
    const response = await axios.put(`${API_URL}/farmer-profile/stats`, stats, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error('Error updating stats:', error);
    throw error;
  }
};