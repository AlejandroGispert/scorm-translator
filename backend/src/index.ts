
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadAWS from './routes/v1/upload';
import uploadAzure from './routes/v2/upload';
import revisionV3 from './routes/v3/revision';
import previewV4 from './routes/v4/preview';
import { testAwsTranslate } from './aws/testAwsTranslate';
import { testMicrosoftTranslate } from './azure/testMicrosoftTranslate';
import downloadRouter from './routes/v2/download';


dotenv.config();

const app = express();


const allowedOrigins = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or Postman) or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.get('/', (_req: Request, res: Response) => {
  res.send(`<h1>Hello, Express + TypeScript!</h1>`);
});
app.use('/api/v1', uploadAWS);
app.use('/api/v2', uploadAzure);
app.use('/api/v2', downloadRouter);
app.use('/api/v3', revisionV3);
app.use('/api/v4', previewV4);


const PORT = process.env.PORT || 3000;
let awsAvailable = false;

app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  awsAvailable = await testAwsTranslate();
  const msTranslateAvailable = await testMicrosoftTranslate();
});
