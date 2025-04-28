import express, { Request, Response } from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { globSync } from 'glob';
import * as fs from 'fs';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('scorm'), async (req: Request, res: Response): Promise<void> => {
  console.log('Received /api/upload request');
  
  if (!req.file || !req.file.path) {
    console.error('No file uploaded or invalid file path.');
    res.status(400).send('No file uploaded or invalid file path.');
    return;
  }

  const zipPath = req.file.path;
  const extractPath = `uploads/${Date.now()}`;
  console.log(`zipPath: ${zipPath}`);
  console.log(`extractPath: ${extractPath}`);

  try {
    // Step 1: Create extraction directory
    fs.mkdirSync(extractPath, { recursive: true });
    console.log('Created extraction directory.');

    // Step 2: Extract the zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
    console.log('Extracted zip file.');

    // Step 3: Find all HTML files
    const htmlFiles = globSync(`${extractPath}/**/*.html`);
    console.log(`Found ${htmlFiles.length} HTML files:`, htmlFiles);

    // Step 4: Replace content in HTML files
    htmlFiles.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf8');
        console.log(`Read file: ${file}`);
        content = content.replace(/Check/g, 'hahahha');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated content in: ${file}`);
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
      }
    });

    // Step 5: Re-zip the folder
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
    console.log('Re-zipped the folder.');

    const outputZip = `${extractPath}.zip`;
    newZip.writeZip(outputZip);
    console.log(`Wrote new zip file: ${outputZip}`);

    // Step 6: Send the new zip back
   
    res.setHeader('Content-Disposition', 'attachment; filename="translated-scorm.zip"');
    res.setHeader('Content-Type', 'application/zip');
    console.log('Starting to stream the zip file to client.');

    const fileStream = fs.createReadStream(outputZip);
    fileStream.pipe(res);

    fileStream.on('error', (streamError) => {
      console.error('Error streaming file:', streamError);
      res.status(500).end();
    });

    res.on('close', () => {
      console.log('Response closed, starting cleanup.');
      try {
        if (fs.existsSync(extractPath)) {
          fs.rmSync(extractPath, { recursive: true, force: true });
          console.log('Deleted extraction directory.');
        }
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
          console.log('Deleted uploaded zip file.');
        }
        if (fs.existsSync(outputZip)) {
          fs.unlinkSync(outputZip);
          console.log('Deleted output zip file.');
        }
      } catch (cleanupError) {
        console.error('Error during cleanup', cleanupError);
      }
    });



  } catch (error) {
    console.error('Failed to process the uploaded SCORM package.', error);
    res.status(500).send('Failed to process the uploaded SCORM package.');

    // Cleanup even if an error happens
    try {
      if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
        console.log('Deleted extraction directory after error.');
      }
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
        console.log('Deleted uploaded zip file after error.');
      }
    } catch (cleanupError) {
      console.error('Error during error-handling cleanup', cleanupError);
    }
  }
});

app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <h1>Hello, Express + TypeScript!</h1>
   
  `);
});


app.get('/api/upload', (_req: Request, res: Response) => {
    res.send(`
      <h1>POST request Here to upload the file</h1>
      
    `);
  });
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
