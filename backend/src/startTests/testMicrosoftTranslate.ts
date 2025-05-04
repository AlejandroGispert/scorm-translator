// testMicrosoftTranslate.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const testMicrosoftTranslate = async (): Promise<boolean> => {
  const key = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;
  const endpoint = "https://api.cognitive.microsofttranslator.com";

  if (!key || !region) {
    console.error('⚠️ Missing Azure Translator environment variables.');
    return false;
  }

  try {
    console.log('🔌 Testing Microsoft Translator connection...');

    const response = await axios({
        baseURL: endpoint,
        url: 'translate',
        method: 'post',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Ocp-Apim-Subscription-Region': region,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4().toString()
        },
        params: {
            'api-version': '3.0',
            'from': 'en',
            'to': 'es'
        },
        data: [{
            'text': 'Hello'
        }],
        responseType: 'json'
      }
    );

    const translatedText = response.data[0]?.translations[0]?.text;
    console.log('✅ Microsoft Translator test successful:', translatedText);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error('⚠️ Microsoft Translator test failed.', error.message);
      } else {
        console.error('⚠️ Microsoft Translator test failed with non-standard error:', error);
      }
      return false;
    }
  }
;
