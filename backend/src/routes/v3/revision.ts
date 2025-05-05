import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { globSync } from 'glob';
import * as XLSX from 'xlsx';

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const upload = multer({
  dest: UPLOADS_DIR,
  fileFilter: (req, file, cb) => {
    const isValid =
      (file.fieldname === 'scorm' && file.mimetype === 'application/zip') ||
      (file.fieldname === 'excel' && file.originalname.endsWith('.xlsx'));
    cb(null, isValid);
  },
});

const multiUpload = upload.fields([
  { name: 'scorm', maxCount: 1 },
  { name: 'excel', maxCount: 1 },
]);

interface RevisionEntry {
  fileName: string;
  originalText: string;
  revision: string;
}

const parseExcelRevisions = (filePath: string): RevisionEntry[] => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return data.map((row: any) => ({
    fileName: row['File Name']?.trim(),
    originalText: row['Original Text']?.toString(),
    revision: row['Revision']?.toString(),
  }));
};

router.post('/revision', multiUpload, async (req: Request, res: Response): Promise<void> => {
  console.log('📩 Received /api/upload/revision request');

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const scormFile = files['scorm']?.[0];
  const excelFile = files['excel']?.[0];

  if (!scormFile || !excelFile) {
    res.status(400).json({ message: 'Both SCORM and Excel files are required.' });
    return;
  }

  const originalName = scormFile.originalname.replace(/\.zip$/i, '').replace(/\s+/g, '-');
  const extractPath = path.join(UPLOADS_DIR, Date.now().toString());

  try {
    fs.mkdirSync(extractPath, { recursive: true });

    const zip = new AdmZip(scormFile.path);
    zip.extractAllTo(extractPath, true);
    console.log('📦 ZIP extracted:', extractPath);

    const revisionEntries = parseExcelRevisions(excelFile.path);
    const revisionsByFile = revisionEntries.reduce((acc, entry) => {
      const file = entry.fileName.trim();
      if (!acc[file]) acc[file] = [];
      acc[file].push(entry);
      return acc;
    }, {} as Record<string, RevisionEntry[]>);

    const htmlFiles = globSync(`${extractPath}/**/*.html`);
    console.log(`🔍 Found ${htmlFiles.length} HTML files`);

    for (const htmlFile of htmlFiles) {
      const baseName = path.basename(htmlFile);
      const fileRevisions = revisionsByFile[baseName];

      if (fileRevisions?.length) {
        let content = fs.readFileSync(htmlFile, 'utf8');

        for (const { originalText, revision } of fileRevisions) {
          if (content.includes(originalText)) {
            content = content.replace(originalText, revision);
            console.log(`🔄 Replaced in ${baseName}: "${originalText}" → "${revision}"`);
          }
        }

        fs.writeFileSync(htmlFile, content, 'utf8');
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

    const finalZipBuffer = finalZip.toBuffer();
    const revisedFilename = `REVISED-${originalName}.zip`;

    res.setHeader('Content-Disposition', `attachment; filename="${revisedFilename}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', finalZipBuffer.length.toString());
    res.send(finalZipBuffer);
    console.log(`📤 Sent: ${revisedFilename}`);
  } catch (error) {
    console.error('❌ Error during revision processing:', error);
    res.status(500).json({ message: 'Failed to process revision files.' });
  }
});

export default router;
