// testAwsTranslate.ts
import { TranslateTextCommand } from '@aws-sdk/client-translate';
import { translateClient } from '../translateScormHtml';

export const testAwsTranslate = async (): Promise<boolean> => {
  try {
    console.log('🔌 Testing AWS Translate connection...');
    const command = new TranslateTextCommand({
      Text: 'Hello',
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'es',
    });

    const response = await translateClient.send(command);
    console.log('✅ AWS Translate test successful:', response.TranslatedText);
    return true;
  } catch (error) {
    console.error('⚠️ Warning: AWS Translate connection failed. Running without live translation.');
    return false;
  }
};
