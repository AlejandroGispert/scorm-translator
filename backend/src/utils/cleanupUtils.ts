// src/utils/cleanupUtils.ts

import fs from 'fs';

export function cleanupFiles(...paths: string[]): void {
  console.log('🧹 Starting cleanup...'); // Log to confirm cleanup is starting

  for (const filePath of paths) {
    try {
      console.log(`🔍 Checking file/directory: ${filePath}`);
      
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`🧹 Cleaned up directory: ${filePath}`);
        } else {
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleaned up file: ${filePath}`);
        }
      } else {
        console.log(`⚠️ File/Directory not found: ${filePath}`);
      }
    } catch (err) {
      console.error(`❌ Error deleting ${filePath}:`, err);
    }
  }
}
