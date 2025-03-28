/**
 * Security Utilities
 * Created: 2025-03-28
 * Author: GitHub Copilot for krackn88
 * 
 * This module handles encryption/decryption and other security-related functions
 */

import CryptoJS from 'crypto-js';

// Encryption key from environment
let encryptionKey = null;

/**
 * Initialize security settings
 * @param {string} key - Encryption key from server
 */
export const initializeSecurity = (key) => {
  if (!key) {
    console.error('No encryption key provided');
    return false;
  }
  
  encryptionKey = key;
  return true;
};

/**
 * Encrypt sensitive data
 * @param {string} plaintext - Data to encrypt
 * @returns {string} - Encrypted data
 */
export const encryptData = (plaintext) => {
  if (!encryptionKey) {
    console.error('Encryption key not initialized');
    return null;
  }
  
  try {
    return CryptoJS.AES.encrypt(plaintext, encryptionKey).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

/**
 * Decrypt sensitive data
 * @param {string} ciphertext - Encrypted data
 * @returns {string} - Decrypted data
 */
export const decryptData = (ciphertext) => {
  if (!encryptionKey) {
    console.error('Encryption key not initialized');
    return null;
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

/**
 * Decrypt credential from server
 * @param {string} encryptedCredential - Encrypted credential
 * @returns {Promise<string>} - Decrypted credential
 */
export const decryptCredential = async (encryptedCredential) => {
  try {
    // In a real implementation, this might involve a server call
    // to avoid exposing the actual decryption key in client code
    return decryptData(encryptedCredential);
  } catch (error) {
    console.error('Failed to decrypt credential:', error);
    return null;
  }
};

/**
 * Securely store credential in local storage with expiration
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @param {number} expirationMinutes - Minutes until expiration
 */
export const securelyStoreLocal = (key, value, expirationMinutes = 60) => {
  try {
    const encryptedValue = encryptData(value);
    if (!encryptedValue) return false;
    
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + expirationMinutes);
    
    const storageItem = {
      value: encryptedValue,
      expiration: expirationTime.getTime()
    };
    
    localStorage.setItem(key, JSON.stringify(storageItem));
    return true;
  } catch (error) {
    console.error('Failed to securely store data:', error);
    return false;
  }
};

/**
 * Retrieve securely stored data from local storage
 * @param {string} key - Storage key
 * @returns {string|null} - Retrieved value or null if expired/missing
 */
export const getSecurelyStoredLocal = (key) => {
  try {
    const storageItem = localStorage.getItem(key);
    if (!storageItem) return null;
    
    const parsedItem = JSON.parse(storageItem);
    
    // Check expiration
    if (parsedItem.expiration < new Date().getTime()) {
      localStorage.removeItem(key);
      return null;
    }
    
    return decryptData(parsedItem.value);
  } catch (error) {
    console.error('Failed to retrieve securely stored data:', error);
    return null;
  }
};

export default {
  initializeSecurity,
  encryptData,
  decryptData,
  decryptCredential,
  securelyStoreLocal,
  getSecurelyStoredLocal
};
