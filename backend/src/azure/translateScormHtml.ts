import { load } from 'cheerio';
import { Node, Text } from 'domhandler';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY!;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION!;
const AZURE_TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';

export async function azureTranslate(text: string, targetLang = 'es'): Promise<string> {
  try {
    const response = await axios({
      baseURL: AZURE_TRANSLATOR_ENDPOINT,
      url: '/translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
        'Content-Type': 'application/json',
      },
      params: {
        'api-version': '3.0',
        to: targetLang,
      },
      data: [{ Text: text }],
      responseType: 'json',
    });

    const translated = response.data[0]?.translations[0]?.text ?? '';
    console.log(`Translated: "${text.slice(0, 30)}..." → "${translated.slice(0, 30)}..."`);
    return translated;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Azure Translate error:', error.response?.data || error.message);
    } else {
      console.error('Azure Translate unknown error:', error);
    }
    throw new Error('Failed to translate text with Azure');
  }
}

export async function translateHtmlContent(html: string, targetLang = 'es'): Promise<string> {
  console.log('Starting HTML translation process');

  if (typeof html !== 'string') {
    throw new TypeError('Expected html to be a string');
  }

  const $ = load(html);

  // Exclude script, style, and meta content
  $('script, style, meta, noscript, link, title').remove();

  const textNodes: Node[] = [];

  $('*').contents().each(function () {
    if (
      this.type === 'text' &&
      this.data &&
      this.data.trim().length > 0 &&
      $(this).closest('script, style, meta, noscript').length === 0
    ) {
      textNodes.push(this);
    }
  });

  console.log(`Found ${textNodes.length} text nodes to translate.`);

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    if (node.type === 'text' && 'data' in node) {
      const originalText = (node as Text).data!;
      try {
        const translated = await azureTranslate(originalText, targetLang);
        (node as Text).data = translated;
        console.log(`✅ Translated node ${i + 1}/${textNodes.length}`);
      } catch (err) {
        console.error(`❌ Error translating node ${i + 1}:`, err);
      }
    }
  }

  console.log('✅ Completed HTML translation process');
  return $.html();
}
