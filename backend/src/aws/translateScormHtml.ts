import { load } from 'cheerio';
import { Node, Text } from 'domhandler';
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import dotenv from 'dotenv';
dotenv.config();

export const translateClient = new TranslateClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
export async function awsTranslate(text: string, targetLang = 'es'): Promise<string> {
  console.log(`Translating text: "${text.slice(0, 30)}..." to ${targetLang}`);

  const command = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: 'auto',
    TargetLanguageCode: targetLang,
  });

  try {
    const response = await translateClient.send(command);
    const translated = response.TranslatedText ?? '';
    console.log(`Translated: "${translated.slice(0, 30)}..."`);
    return translated;
  } catch (error) {
    console.error('AWS Translate error:', error);
    throw new Error('Failed to translate text');
  }
}

export async function translateHtmlContent(html: string, targetLang = 'es'): Promise<string> {
  console.log('Starting HTML translation process');

  if (typeof html !== 'string') {
    throw new TypeError('Expected html to be a string');
  }

  const $ = load(html);
  const textNodes: Node[] = [];

  $('*').contents().each(function () {
    if (this.type === 'text' && this.data && this.data.trim()) {
      textNodes.push(this);
    }
  });

  console.log(`Found ${textNodes.length} text nodes to translate.`);

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    if (node.type === 'text' && 'data' in node) {
      try {
        const originalText = (node as Text).data!;
        const translated = await awsTranslate(originalText, targetLang);
        (node as Text).data = translated;
        console.log(`Translated node ${i + 1}/${textNodes.length}`);
      } catch (err) {
        console.error(`Error translating node ${i + 1}:`, err);
      }
    }
  }

  console.log('Completed HTML translation process');
  return $.html();
}
