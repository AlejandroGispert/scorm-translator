import axios from 'axios';

export async function createTranslationTableIfNotExists(
  accessToken: string,
  driveId: string,
  itemId: string,
  sheetName = 'Sheet1',
  tableName = 'TranslationTable'
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // Check if the table already exists
    const existingTables = await axios.get(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/tables`,
      { headers }
    );

    const tableExists = existingTables.data.value.some(
      (t: any) => t.name === tableName
    );

    if (tableExists) {
      console.log(`✅ Table '${tableName}' already exists.`);
      return;
    }

    // Create a new table in the worksheet
    const createResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/worksheets/${sheetName}/tables/add`,
      {
        address: 'A1:E1',
        hasHeaders: true,
      },
      { headers }
    );

    const newTableId = createResponse.data.id;

    // Rename the table to your preferred name
    await axios.patch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/tables/${newTableId}`,
      {
        name: tableName,
      },
      { headers }
    );

    // Set headers in the first row (optional but recommended)
    await axios.patch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/worksheets/${sheetName}/range(address='A1:E1')`,
      {
        values: [
          ['File Name', 'Element Context', 'Original Text', 'Translated Text', 'Revision'],
        ],
      },
      { headers }
    );

    console.log(`✅ Table '${tableName}' created and headers set.`);
  } catch (err: any) {
    console.error('❌ Failed to create table:', err.response?.data || err.message);
    throw err;
  }
}
