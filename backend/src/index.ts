
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadV1 from './routes/v1/upload';
import uploadV2 from './routes/v2/upload';
import { translateHtmlContent,translateClient } from './translateScormHtml';
import { TranslateTextCommand } from '@aws-sdk/client-translate';

dotenv.config();

const app = express();

const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDev ? '*' : process.env.CORS_ORIGIN
}));
app.get('/', (_req: Request, res: Response) => {
  res.send(`<h1>Hello, Express + TypeScript!</h1>`);
});
app.use('/api/v1', uploadV1);
app.use('/api/v2', uploadV2);





const PORT = process.env.PORT || 3000;
let awsAvailable = false;

app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  try {
    console.log('🔌 Testing AWS Translate connection...');
    const command = new TranslateTextCommand({
      Text: 'Hello',
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'es',
    });

    const response = await translateClient.send(command);
    console.log('✅ AWS Translate test successful:', response.TranslatedText);
    awsAvailable = true;
  } catch (error) {
    console.error('⚠️ Warning: AWS Translate connection failed. Running without live translation.');
    awsAvailable = false;
  }
});
