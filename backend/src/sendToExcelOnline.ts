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

  console.log('🔄 Preparing to send translations to Excel...');
  console.log(`📄 Total entries to send: ${rows.length}`);
  console.log(`📁 Drive ID: ${driveId}`);
  console.log(`📄 Item (Excel File) ID: ${itemId}`);

  try {
    console.log('📡 Fetching available tables in the workbook...');
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/tables`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const tables = response.data.value;
    console.log(`📊 Tables found: ${tables.map((t: any) => t.name).join(', ')}`);

    const table = tables.find((t: any) => t.name === 'Translations') || tables[0];

    if (!table) {
      console.error('🚫 No table found in workbook.');
      throw new Error('No Excel table found and no default fallback available.');
    }

    const tableId = table.id;
    console.log(`✅ Using table: ${table.name} (ID: ${tableId})`);

    console.log('📤 Sending rows to Excel table...');
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
    console.error('❌ Failed to send to Excel Online:');
    if (err.response) {
      console.error('📥 Response data:', err.response.data);
      console.error('📟 Status:', err.response.status);
      console.error('📫 Headers:', err.response.headers);
    } else {
      console.error('⚠️ Error message:', err.message);
    }
    throw err;
  }
}
