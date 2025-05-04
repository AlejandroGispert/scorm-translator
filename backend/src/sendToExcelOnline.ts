import axios from 'axios';

export interface TranslationEntry {
  fileName: string;
  elementContext: string;
  originalText: string;
  translatedText: string;
  revision?: string;
}

export async function sendTranslationsToExcel(
  entries: TranslationEntry[],
  accessToken: string,
  driveId: string,
  itemId: string
): Promise<void> {
  const rows = entries.map(entry => [
    entry.fileName,
    entry.elementContext,
    entry.originalText,
    entry.translatedText,
    entry.revision || '',
  ]);

  try {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/tables`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const tables = response.data.value;
    const table = tables.find((t: any) => t.name === 'Translations') || tables[0];

    if (!table) {
      throw new Error('No Excel table found and no default fallback available.');
    }

    const tableId = table.id;

    await axios.post(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/tables/${tableId}/rows/add`,
      {
        values: rows,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Data successfully sent to Excel Online.');
  } catch (err: any) {
    console.error('❌ Failed to send to Excel Online:', err.response?.data || err.message || err);
    throw err;
  }
}
