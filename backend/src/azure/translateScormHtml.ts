import { load } from 'cheerio';
import { Element as CheerioElement } from 'domhandler';
import { Node, Text } from 'domhandler';
import axios from 'axios';
import dotenv from 'dotenv';
import { TranslationEntry } from '../sendToExcelOnline';

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

    return response.data[0]?.translations[0]?.text ?? '';
  } catch (error) {
    console.error('Azure Translate error:', error);
    throw new Error('Failed to translate text with Azure');
  }
}

export async function translateHtmlContent(
  html: string,
  fileName: string,
  targetLang = 'es'
): Promise<{ translatedHtml: string; entries: TranslationEntry[] }> {
  const $ = load(html);
  $('script, style, meta, noscript, link, title').remove();

  const textNodes: Text[] = [];
  const entries: TranslationEntry[] = [];

  $('*').contents().each(function () {
    if (
      this.type === 'text' &&
      'data' in this &&
      this.data?.trim().length > 0 &&
      $(this).closest('script, style, meta, noscript').length === 0
    ) {
      textNodes.push(this as Text);
    }
  });

  for (const node of textNodes) {
    const originalText = node.data!;
    const translatedText = await azureTranslate(originalText, targetLang);
    node.data = translatedText;

    const parentElement = $(node).parent().get(0);
    const tagName =
      parentElement && 'tagName' in parentElement
        ? (parentElement as CheerioElement).tagName
        : '';

    entries.push({
      fileName,
      elementContext: tagName,
      originalText,
      translatedText,
    });
  }

  return {
    translatedHtml: $.html(),
    entries,
  };
}
