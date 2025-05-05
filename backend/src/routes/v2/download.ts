import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { cleanupFiles } from '../../utils/cleanupUtils'; // Import cleanup function

const router = express.Router();

router.get('/download/excel', (req: Request, res: Response): void => {
  const uploadsDir = path.join(__dirname, '../../../uploads');
  const fileName = 'ES-translated.xlsx'; // Excel file name
  const filePath = path.join(uploadsDir, fileName);

  console.log('📄 File path:', filePath);

  // Validate if the Excel file exists
  if (!fs.existsSync(filePath)) {
    console.warn('⚠️ Excel file not found.');
    res.status(404).send('Excel file not found.');
    return;
  }

  // Set headers for downloading the file
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  try {
    const stream = fs.createReadStream(filePath); // Create a readable stream from the file
    console.log(`📤 Starting download: ${fileName}`);
    stream.pipe(res); // Pipe the stream to the response object

    // Clean up the file after download
    stream.on('close', () => {
      console.log(`✅ Download completed: ${fileName}`);
    
      cleanupFiles(uploadsDir);
    });

    // Handle potential stream errors
    stream.on('error', (err) => {
      console.error('❌ Stream error during Excel file download:', err);
      res.status(500).send('Error while downloading Excel file.');
    });
  } catch (err) {
    console.error('❌ Failed to create read stream:', err);
    res.status(500).send('Failed to download Excel file.');
  }
});

export default router;
