import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { globSync } from 'glob';

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const upload = multer({ dest: UPLOADS_DIR });

interface RevisionEntry {
  fileName: string;
  originalText: string;
  revision: string;
}

interface MulterRequest extends Request {
  files: { [fieldname: string]: Express.Multer.File[] };
}

const multiUpload = upload.fields([
  { name: 'scorm', maxCount: 1 },
  { name: 'excel', maxCount: 1 },
]);
router.get('/revision/preview', (_req: Request, res: Response) => {
  res.send(`<h1>POST request here to upload the file</h1>`);
});
router.post('/revision/preview', multiUpload, async (req: Request, res: Response): Promise<void> => {
  console.log('👀 Received /api/upload/revision/preview request');

  const { files } = req as MulterRequest;
  const scormFile = files['scorm']?.[0];
  const excelFile = files['excel']?.[0];

  if (!scormFile || !excelFile) {
    res.status(400).json({ message: 'Both SCORM and Excel files are required.' });
    return;
  }

  const extractPath = path.join(UPLOADS_DIR, `preview-${Date.now()}`);

  try {
    fs.mkdirSync(extractPath, { recursive: true });

    const zip = new AdmZip(scormFile.path);
    zip.extractAllTo(extractPath, true);
    console.log('📦 ZIP extracted to preview:', extractPath);

    const revisionEntries = parseExcelRevisions(excelFile.path);

    const revisionsByFile = revisionEntries.reduce((acc, entry) => {
      const file = entry.fileName.trim();
      if (!acc[file]) acc[file] = [];
      acc[file].push(entry);
      return acc;
    }, {} as Record<string, RevisionEntry[]>);

    const htmlFiles = globSync(`${extractPath}/**/*.html`);
    const previewResult: {
      file: string;
      matches: { originalText: string; revision: string }[];
    }[] = [];

    for (const htmlFile of htmlFiles) {
      const baseName = path.basename(htmlFile);
      const fileRevisions = revisionsByFile[baseName];

      if (fileRevisions?.length) {
        const content = fs.readFileSync(htmlFile, 'utf8');
        const matches: { originalText: string; revision: string }[] = [];

        for (const { originalText, revision } of fileRevisions) {
          if (content.includes(originalText)) {
            matches.push({ originalText, revision });
          }
        }

        if (matches.length > 0) {
          previewResult.push({ file: baseName, matches });
        }
      }
    }

    res.json({ preview: previewResult });
    console.log('✅ Preview generated');
  } catch (error) {
    console.error('❌ Error generating preview:', error);
    res.status(500).json({ message: 'Failed to generate revision preview.' });
  }
});

// Stub: implement your Excel parsing logic
function parseExcelRevisions(excelFilePath: string): RevisionEntry[] {
  return []; // To be implemented
}

export default router;
