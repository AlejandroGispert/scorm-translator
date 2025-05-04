import ExcelJS from 'exceljs';

export interface TranslationEntry {
  fileName: string;
  elementContext: string;
  originalText: string;
  translatedText: string;
  revision?: string;
}

export async function getExcelBuffer(
  entries: TranslationEntry[],
  languageCode: string,
  baseFileName = 'translated'
): Promise<{ buffer: Buffer; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Translations');

  worksheet.columns = [
    { header: 'File Name', key: 'fileName', width: 30 },
    { header: 'Element Context', key: 'elementContext', width: 30 },
    { header: 'Original Text', key: 'originalText', width: 40 },
    { header: 'Translated Text', key: 'translatedText', width: 40 },
    { header: 'Revision', key: 'revision', width: 20 },
  ];

  entries.forEach(entry => {
    worksheet.addRow({
      fileName: entry.fileName,
      elementContext: entry.elementContext,
      originalText: entry.originalText,
      translatedText: entry.translatedText,
      revision: entry.revision || '',
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer); 
  const finalFileName = `${languageCode.toUpperCase()}-${baseFileName}.xlsx`;

  return { buffer, fileName: finalFileName };
}
