import cheerio from 'cheerio';
import { Node, Text } from 'domhandler';
import fetch from 'node-fetch';

export async function libreTranslate(text: string, targetLang = 'es'): Promise<string> {
  
    const fetch = (await import('node-fetch')).default; 
  
    console.log(`Translating text: "${text.slice(0, 30)}..." to ${targetLang}`); // Log small preview

  const res = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'auto',
      target: targetLang,
      format: 'text'
    })
  });

  if (!res.ok) {
    console.error(`Translation API error: ${res.status} - ${res.statusText}`);
    throw new Error(`Translation API error: ${res.statusText}`);
  }

  const data = await res.json() as { translatedText: string };
  console.log(`Translated text: "${data.translatedText.slice(0, 30)}..."`);
  return data.translatedText;
}

export async function translateHtmlContent(html: string, targetLang = 'es'): Promise<string> {
  console.log('Starting HTML translation process');

  if (typeof html !== 'string') {
    console.error('Invalid HTML input detected');
    throw new TypeError('Expected html to be a string');
  }

  const $ = cheerio.load(html);
  const textNodes: Node[] = [];

  $('*').contents().each(function () {
    if (this.type === 'text' && this.data && this.data.trim()) {
      textNodes.push(this);
    }
  });

  console.log(`Found ${textNodes.length} text nodes to translate.`);

  let index = 0;
  for (const node of textNodes) {
    if (node.type === 'text' && 'data' in node) {
      try {
        const originalText = (node as Text).data!;
        console.log(`Translating node ${index + 1}/${textNodes.length}: "${originalText.slice(0, 30)}..."`);

        (node as Text).data = await libreTranslate(originalText, targetLang);

        console.log(`Successfully translated node ${index + 1}`);
      } catch (error) {
        console.error(`Error translating node ${index + 1}:`, error);
      }
    }
    index++;
  }

  console.log('Completed HTML translation process');

  return $.html();
}
