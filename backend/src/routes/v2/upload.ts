import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { globSync } from 'glob';
import { translateHtmlContent } from '../../azure/translateScormHtml';
import { getExcelBuffer } from '../../utils/exportToExcel';
import { TranslationEntry } from '../../sendToExcelOnline';

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const upload = multer({ dest: UPLOADS_DIR });


interface MulterRequest extends Request {
  file: Express.Multer.File;
}

router.get('/upload', (_req: Request, res: Response) => {
  res.send(`<h1>POST request here to upload the file</h1>`);
});

router.post('/upload', upload.single('scorm'), async (req: Request, res: Response): Promise<void> => {
  console.log('📩 Received /api/upload request');
  const file = (req as MulterRequest).file;

  if (!file?.path) {
    console.error('❌ No file uploaded or invalid file path.');
    res.status(400).send('No file uploaded or invalid file path.');
    return;
  }

  const zipPath = file.path;
  const extractPath = path.join(UPLOADS_DIR, Date.now().toString());
  const translationEntries: TranslationEntry[] = [];

  try {
    fs.mkdirSync(extractPath, { recursive: true });
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
    console.log('📦 ZIP extracted:', extractPath);

    const htmlFiles = globSync(`${extractPath}/**/*.html`);
    console.log(`🔍 Found ${htmlFiles.length} HTML files to translate.`);

    for (const htmlFile of htmlFiles) {
      try {
        const originalContent = fs.readFileSync(htmlFile, 'utf8');
        const { translatedHtml, entries } = await translateHtmlContent(originalContent, path.basename(htmlFile), 'es');
        fs.writeFileSync(htmlFile, translatedHtml, 'utf8');
        translationEntries.push(...entries);
        console.log(`✅ Translated: ${htmlFile}`);
      } catch (fileError) {
        console.error(`❌ Error processing file ${htmlFile}:`, fileError);
      }
    }

    const finalZip = new AdmZip();
    const addDirToZip = (dir: string, zipFolder = ''): void => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const relPath = path.join(zipFolder, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
          addDirToZip(fullPath, relPath);
        } else {
          finalZip.addLocalFile(fullPath, zipFolder);
        }
      });
    };
    addDirToZip(extractPath);
    console.log('📁 Final ZIP created.');

    try {
      const { buffer: excelBuffer, fileName: excelName } = await getExcelBuffer(translationEntries, 'es');
      const excelTempPath = path.join(UPLOADS_DIR, `${excelName}`);
      fs.writeFileSync(excelTempPath, excelBuffer);
      console.log('📄 Excel file saved:', excelTempPath);


      const finalZipBuffer = finalZip.toBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename="translated-scorm.zip"');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Length', finalZipBuffer.length.toString());
      res.send(finalZipBuffer);
      console.log('📤 SCORM ZIP sent to client.');
    } catch (excelErr) {
      console.error('❌ Error creating or sending Excel/ZIP:', excelErr);
      res.status(500).send('Failed to prepare translated SCORM package.');
    }

  } catch (error) {
    console.error('❌ Failed to process uploaded SCORM package.', error);
    res.status(500).send('Failed to process the uploaded SCORM package.');
  }
});


export default router;
