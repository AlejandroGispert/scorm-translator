// routes/v1/upload.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { globSync } from 'glob';
import { translateHtmlContent } from '../../aws/translateScormHtml';


const router = express.Router();



const upload = multer({ dest: 'uploads/' });


router.get('/upload', (_req: Request, res: Response) => {
    res.send(`<h1>POST request here to upload the file</h1>`);
  });

router.post('/upload',  upload.single('scorm'), async (req: Request, res: Response): Promise<void> => {
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
    for (const file of htmlFiles) {
        try {
          let content = fs.readFileSync(file, 'utf8');
          console.log(`Read file: ${file}`);


          content = await translateHtmlContent(content); 
          
          // <-- await here
          fs.writeFileSync(file, content, 'utf8');
          console.log(`Updated content in: ${file}`);
        } catch (fileError) {
          console.error(`Error processing file ${file}:`, fileError);
        }
      }
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
  

export default router;
