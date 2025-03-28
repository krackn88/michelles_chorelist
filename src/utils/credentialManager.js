/**
 * Secure Credential Manager
 * Handles storage and retrieval of sensitive credentials
 */
import CryptoJS from 'crypto-js';

// Encryption secret derived from a secure combination of user and device info
const getEncryptionKey = () => {
  const userAgent = navigator.userAgent;
  const hostname = window.location.hostname;
  return CryptoJS.SHA256(`${userAgent}-${hostname}-family-chore-manager`).toString();
};

class CredentialManager {
  constructor() {
    this.storagePrefix = 'fcm_secure_';
    this.encryptionKey = getEncryptionKey();
  }

  /**
   * Save credentials securely
   * @param {string} key - Credential identifier
   * @param {any} value - Value to store securely
   */
  saveCredential(key, value) {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(value),
        this.encryptionKey
      ).toString();
      localStorage.setItem(`${this.storagePrefix}${key}`, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to save credential:', error);
      return false;
    }
  }

  /**
   * Retrieve securely stored credentials
   * @param {string} key - Credential identifier
   * @returns {any|null} - Decrypted credential or null if not found
   */
  getCredential(key) {
    try {
      const encrypted = localStorage.getItem(`${this.storagePrefix}${key}`);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve credential:', error);
      return null;
    }
  }

  /**
   * Remove a stored credential
   * @param {string} key - Credential identifier
   */
  removeCredential(key) {
    localStorage.removeItem(`${this.storagePrefix}${key}`);
  }

  /**
   * Check if a credential exists
   * @param {string} key - Credential identifier
   * @returns {boolean} - True if credential exists
   */
  hasCredential(key) {
    return localStorage.getItem(`${this.storagePrefix}${key}`) !== null;
  }
}

export default new CredentialManager();
