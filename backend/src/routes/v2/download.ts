import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { cleanupFiles } from '../../utils/cleanupUtils'; // Import cleanup function

const router = express.Router();

router.get('/download/excel', (req: Request, res: Response): void => {
  const uploadsDir = path.join(__dirname, '../../../uploads');
  const outputLang = req.query.outputLang ? (req.query.outputLang as string).toUpperCase() : 'ES'; // Default to 'ES' if no outputLang is specified
  const fileName = `${outputLang}-translated.xlsx`;
  const filePath = path.join(uploadsDir, fileName);

  console.log('📄 Excel file path:', filePath);

  if (!fs.existsSync(filePath)) {
    console.warn('⚠️ Excel file not found:', fileName);
    res.status(404).send('Excel file not found.');
    return;
  }

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  try {
    const stream = fs.createReadStream(filePath);
    console.log(`📤 Starting download: ${fileName}`);
    stream.pipe(res);

    stream.on('close', () => {
      console.log(`✅ Download completed: ${fileName}`);
      cleanupFiles(uploadsDir); // Clean up after sending
    });

    stream.on('error', (err) => {
      console.error('❌ Stream error:', err);
      res.status(500).send('Error while downloading Excel file.');
    });
  } catch (err) {
    console.error('❌ Failed to stream Excel file:', err);
    res.status(500).send('Failed to download Excel file.');
  }
});

export default router;
