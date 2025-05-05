// src/utils/cleanupUtils.tsimport fs from 'fs';
import path from 'path';

import fs from 'fs';

export const cleanupFiles = (dirPath: string): void => {
  try {
    // Check if the directory exists
    if (fs.existsSync(dirPath)) {
      // Get all files and directories inside the directory
      const files = fs.readdirSync(dirPath);
      
      // Loop through each item and delete it
      files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.lstatSync(fullPath);

        if (stat.isDirectory()) {
          cleanupFiles(fullPath); // If it's a directory, call cleanup recursively
          fs.rmdirSync(fullPath); // Remove the directories after cleaning up
        } else {
          fs.unlinkSync(fullPath); // If it's a file, delete it
        }
      });

      console.log(`✅ Cleanup successful for directory: ${dirPath}`);
    } else {
      console.warn(`⚠️ Directory not found for cleanup: ${dirPath}`);
    }
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
  }
};