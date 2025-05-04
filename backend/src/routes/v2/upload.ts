// routes/v1/upload.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { globSync } from 'glob';
import { translateHtmlContent } from '../../translateScormHtml';
import { getAccessToken } from '../../auth';
import { createTranslationTableIfNotExists } from '../../createTranslationTableIfNotExists';
import { sendTranslationsToExcel, TranslationEntry } from '../../sendToExcelOnline';

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const upload = multer({ dest: UPLOADS_DIR });

function cleanupFiles(...paths: string[]) {
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    } catch (err) {
      console.error(`Error deleting ${filePath}:`, err);
    }
  }
}

interface MulterRequest extends Request {
  file: Express.Multer.File;
}
router.get('/upload', (_req: Request, res: Response) => {
    res.send(`<h1>POST request here to upload the file</h1>`);
  });

router.post('/upload', upload.single('scorm'), async (req: Request, res: Response): Promise<void> => {
    console.log('📩 Received /api/upload request');
    const file = (req as MulterRequest).file;

  if (!file || !file.path) {
    console.error('❌ No file uploaded or invalid file path.');
    res.status(400).send('No file uploaded or invalid file path.');
    return;
  }

  const zipPath = file.path;
    const extractPath = path.join(UPLOADS_DIR, Date.now().toString());
    console.log(`🗂️ zipPath: ${zipPath}`);
    console.log(`📁 extractPath: ${extractPath}`);
  
  
    const translationEntries: TranslationEntry[] = [];
    
    try {
      fs.mkdirSync(extractPath, { recursive: true });
      console.log('📦 Created extraction directory.');
  
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractPath, true);
      console.log('🧩 Extracted zip file.');
  
      const htmlFiles = globSync(`${extractPath}/**/*.html`);
      console.log(`🔍 Found ${htmlFiles.length} HTML files:`, htmlFiles);
  
      for (const file of htmlFiles) {
        try {
          const originalContent = fs.readFileSync(file, 'utf8');
          console.log(`📄 Reading file: ${file}`);
  
          const translatedContent =  await translateHtmlContent(originalContent); // Translate HTML content
  
          fs.writeFileSync(file, translatedContent, 'utf8');
          console.log(`✅ Translated and updated: ${file}`);
  
          translationEntries.push({
            fileName: path.basename(file),
            elementContext: 'body',
            originalText: originalContent,
            translatedText: translatedContent,
          });
  
  
        } catch (fileError) {
          console.error(`❌ Error processing file ${file}:`, fileError);
        }
      }
  
       // Send translation metadata to Excel
       try {
        const accessToken = await getAccessToken();
        const driveId = process.env.MS_DRIVE_ID!;
        const itemId = process.env.MS_EXCEL_FILE_ID!;
        await createTranslationTableIfNotExists(accessToken, driveId, itemId);
        await sendTranslationsToExcel(translationEntries, accessToken, driveId, itemId);
        console.log('📊 Translations logged to Excel.');
      } catch (excelError) {
        console.error('❌ Failed to send translation data to Excel:', excelError);
      }
  
      
      const newZip = new AdmZip();
  
      function addDirToZip(dir: string, zipFolder = ''): void {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = path.join(dir, file);
          const relPath = path.join(zipFolder, file);
          if (fs.lstatSync(fullPath).isDirectory()) {
            addDirToZip(fullPath, relPath);
          } else {
            newZip.addLocalFile(fullPath, zipFolder);
          }
        });
      }
  
      addDirToZip(extractPath);
      console.log('📦 Re-zipped the folder.');
  
      const outputZip = `${extractPath}.zip`;
      newZip.writeZip(outputZip);
      console.log(`💾 Wrote new zip file: ${outputZip}`);
  
      res.setHeader('Content-Disposition', 'attachment; filename="translated-scorm.zip"');
      res.setHeader('Content-Type', 'application/zip');
      console.log('📤 Streaming zip file to client...');
  
      const fileStream = fs.createReadStream(outputZip);
      fileStream.pipe(res);
  
      fileStream.on('error', (streamError) => {
        console.error('❌ Error streaming file:', streamError);
        if (!res.headersSent) {
          res.status(500).send('Error streaming file');
        }
      });
  
      res.on('close', () => {
        console.log('🧹 Response closed, cleaning up...');
        cleanupFiles(extractPath, zipPath, outputZip);
      });
  
    } catch (error) {
      console.error('❌ Failed to process the uploaded SCORM package.', error);
      res.status(500).send('Failed to process the uploaded SCORM package.');
      cleanupFiles(extractPath, zipPath);
    }
  });

 
export default router;
