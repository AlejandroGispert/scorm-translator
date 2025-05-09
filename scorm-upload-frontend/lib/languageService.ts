// lib/languageService.ts

export interface LanguageOption {
  code: string;
  name: string;
}

const BASE_URL = 'https://api.cognitive.microsofttranslator.com/languages?api-version=3.0&scope=translation';

export async function fetchSupportedLanguages(): Promise<LanguageOption[]> {
  const res = await fetch(BASE_URL);
  const data = await res.json();

  if (!data.translation) throw new Error('Invalid response from translation API');

  const languages = Object.entries(data.translation).map(([code, value]: [string, any]) => ({
    code,
    name: value.name,
  }));

  return [{ code: 'auto', name: 'Auto Detect' }, ...languages];
}
