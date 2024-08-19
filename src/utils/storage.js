import { isExtensionEnvironment } from './environment';

export const storage = {
  get: (keys, callback) => {
    if (isExtensionEnvironment()) {
      chrome.storage.local.get(keys, callback);
    } else {
      const result = {};
      keys.forEach((key) => {
        result[key] = JSON.parse(localStorage.getItem(key) || 'null');
      });
      callback(result);
    }
  },
  set: (items, callback) => {
    if (isExtensionEnvironment()) {
      chrome.storage.local.set(items, callback);
    } else {
      Object.keys(items).forEach((key) => {
        localStorage.setItem(key, JSON.stringify(items[key]));
      });
      if (callback) callback();
    }
  },
  remove: (keys, callback) => {
    if (isExtensionEnvironment()) {
      chrome.storage.local.remove(keys, callback);
    } else {
      keys.forEach((key) => localStorage.removeItem(key));
      if (callback) callback();
    }
  },
};
