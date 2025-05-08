import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { globSync } from 'glob';
import xlsx from 'xlsx';

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

router.get('/upload/revision/preview', (_req: Request, res: Response) => {
  res.send(`<h1>POST request here to upload the file</h1>`);
});

router.post('/upload/revision/preview', multiUpload, async (req: Request, res: Response): Promise<void> => {
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
  } finally {
    // Clean up uploaded files
    try {
      fs.unlinkSync(scormFile.path);
      fs.unlinkSync(excelFile.path);
    } catch (err) {
      console.warn('⚠️ Failed to clean up temporary files:', err);
    }
  }
});

// Parses Excel file for revisions
function parseExcelRevisions(excelFilePath: string): RevisionEntry[] {
  try {
    const workbook = xlsx.readFile(excelFilePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    const headers = data[0].map(h => h?.toString().trim().toLowerCase());

    const fileNameIdx = headers.indexOf('file name');
    const originalTextIdx = headers.indexOf('original text');
    const revisionIdx = headers.indexOf('revision');
    const translatedIdx = headers.indexOf('translated text'); // for fallback

    if (fileNameIdx === -1 || originalTextIdx === -1) {
      throw new Error('Excel file is missing required columns: File Name, Original Text');
    }

    const entries: RevisionEntry[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const fileName = row[fileNameIdx]?.toString().trim();
      const originalText = row[originalTextIdx]?.toString().trim();
      let revision = row[revisionIdx]?.toString().trim() || '';

      // Fallback to Translated Text if Revision is missing
      if (!revision && translatedIdx !== -1) {
        revision = row[translatedIdx]?.toString().trim() || '';
      }

      if (fileName && originalText && revision) {
        entries.push({ fileName, originalText, revision });
      }
    }

    return entries;
  } catch (err) {
    console.error('❌ Error parsing Excel:', err);
    return [];
  }
}


export default router;
