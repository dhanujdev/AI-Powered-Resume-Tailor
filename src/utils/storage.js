// Storage utility functions for Chrome extension

/**
 * Save data to Chrome's local storage
 * @param {Object} data - Key-value pairs to save
 * @returns {Promise} Promise that resolves when data is saved
 */
export const saveToStorage = (data) => {
  return chrome.storage.local.set(data);
};

/**
 * Retrieve data from Chrome's local storage
 * @param {string|string[]} keys - Key or array of keys to retrieve
 * @returns {Promise<Object>} Promise that resolves with the requested data
 */
export const getFromStorage = (keys) => {
  return chrome.storage.local.get(keys);
};

/**
 * Remove data from Chrome's local storage
 * @param {string|string[]} keys - Key or array of keys to remove
 * @returns {Promise} Promise that resolves when data is removed
 */
export const removeFromStorage = (keys) => {
  return chrome.storage.local.remove(keys);
};

/**
 * Clear all data from Chrome's local storage
 * @returns {Promise} Promise that resolves when all data is cleared
 */
export const clearStorage = () => {
  return chrome.storage.local.clear();
};

/**
 * Save resume to history in Chrome's local storage
 * @param {Object} resumeData - Resume data to save to history
 * @param {number} maxHistory - Maximum number of entries to keep in history
 * @returns {Promise} Promise that resolves when data is saved
 */
export const saveToHistory = async (resumeData, maxHistory = 10) => {
  // Check if history saving is enabled
  const { saveHistory } = await chrome.storage.local.get('saveHistory');
  
  if (saveHistory === false) {
    return;
  }
  
  // Get existing history
  const { tailoringHistory = [] } = await chrome.storage.local.get('tailoringHistory');
  
  // Add new entry with timestamp
  const newEntry = {
    ...resumeData,
    timestamp: new Date().toISOString(),
  };
  
  // Add to beginning of array
  tailoringHistory.unshift(newEntry);
  
  // Limit history to maxHistory entries
  const limitedHistory = tailoringHistory.slice(0, maxHistory);
  
  // Save updated history
  return saveToStorage({ tailoringHistory: limitedHistory });
};

/**
 * Get tailoring history from Chrome's local storage
 * @returns {Promise<Array>} Promise that resolves with the history array
 */
export const getHistory = async () => {
  const { tailoringHistory = [] } = await chrome.storage.local.get('tailoringHistory');
  return tailoringHistory;
};

/**
 * Clear tailoring history from Chrome's local storage
 * @returns {Promise} Promise that resolves when history is cleared
 */
export const clearHistory = () => {
  return removeFromStorage('tailoringHistory');
};

/**
 * Securely store API key in Chrome's local storage
 * @param {string} apiKey - API key to store
 * @returns {Promise} Promise that resolves when API key is stored
 */
export const storeApiKey = (apiKey) => {
  return saveToStorage({ apiKey });
};

/**
 * Retrieve API key from Chrome's local storage
 * @returns {Promise<string|null>} Promise that resolves with the API key or null
 */
export const getApiKey = async () => {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  return apiKey || null;
};

/**
 * Save user settings to Chrome's local storage
 * @param {Object} settings - Settings object to save
 * @returns {Promise} Promise that resolves when settings are saved
 */
export const saveSettings = (settings) => {
  return saveToStorage(settings);
};

/**
 * Get user settings from Chrome's local storage
 * @returns {Promise<Object>} Promise that resolves with the settings object
 */
export const getSettings = async () => {
  const defaultSettings = {
    autoExtract: true,
    saveHistory: true
  };
  
  const settings = await chrome.storage.local.get([
    'autoExtract',
    'saveHistory'
  ]);
  
  return { ...defaultSettings, ...settings };
}; 