import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { globSync } from 'glob';
import { translateHtmlContent } from '../../azure/translateScormHtml';
import { getAccessToken } from '../../auth';
import { sendTranslationsToExcel, TranslationEntry } from '../../sendToExcelOnline';
import { getExcelBuffer } from '../../utils/exportToExcel'; // ✅ In-memory ExcelJS export

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

  if (!file?.path) {
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
    console.log(`🔍 Found ${htmlFiles.length} HTML files.`);

    for (const htmlFile of htmlFiles) {
      try {
        const originalContent = fs.readFileSync(htmlFile, 'utf8');
        console.log(`📄 Translating file: ${htmlFile}`);

        const { translatedHtml, entries } = await translateHtmlContent(originalContent, path.basename(htmlFile), 'es');

        fs.writeFileSync(htmlFile, translatedHtml, 'utf8');
        console.log(`✅ Translated and updated: ${htmlFile}`);

        translationEntries.push(...entries);
      } catch (fileError) {
        console.error(`❌ Error processing file ${htmlFile}:`, fileError);
      }
    }

    // 🔁 Create new in-memory ZIP (SCORM + Excel)
    const finalZip = new AdmZip();

    function addDirToZip(dir: string, zipFolder = ''): void {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const relPath = path.join(zipFolder, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
          addDirToZip(fullPath, relPath);
        } else {
          finalZip.addLocalFile(fullPath, zipFolder);
        }
      });
    }

    addDirToZip(extractPath);
    console.log('📦 Added translated SCORM content to ZIP');

    // 🧾 Generate Excel buffer in-memory
    const { buffer: excelBuffer, fileName: excelName } = await getExcelBuffer(translationEntries, 'es');
    finalZip.addFile(excelName, Buffer.from(excelBuffer));
    console.log('📄 Excel file added to ZIP in memory');

    // 📤 Send in-memory zip
    const finalZipBuffer = finalZip.toBuffer();
    res.setHeader('Content-Disposition', 'attachment; filename="translated-scorm.zip"');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', finalZipBuffer.length.toString());

    res.send(finalZipBuffer);

    // 🧹 Cleanup
    console.log('🧹 Cleaning up temp files...');
    cleanupFiles(extractPath, zipPath);

  } catch (error) {
    console.error('❌ Failed to process the uploaded SCORM package.', error);
    res.status(500).send('Failed to process the uploaded SCORM package.');
    cleanupFiles(extractPath, zipPath);
  }
});

export default router;
