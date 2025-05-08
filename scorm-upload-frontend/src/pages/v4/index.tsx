import { useState } from 'react';
import Head from 'next/head';

export default function UploadRevision() {
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null); // New state for preview results

  const handleScormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScormFile(e.target.files?.[0] || null);
    setUploadMessage(null);
    setError(null);
    setPreviewData(null);
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExcelFile(e.target.files?.[0] || null);
    setUploadMessage(null);
    setError(null);
    setPreviewData(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!scormFile || !excelFile) {
      setError('Both SCORM and Excel files are required.');
      return;
    }

    if (scormFile.type !== 'application/zip' && !scormFile.name.endsWith('.zip')) {
      setError('SCORM file must be a .zip archive.');
      return;
    }

    if (!excelFile.name.endsWith('.xlsx')) {
      setError('Excel file must be a .xlsx file.');
      return;
    }

    const formData = new FormData();
    formData.append('scorm', scormFile);
    formData.append('excel', excelFile);

    setUploading(true);
    setError(null);
    setUploadMessage(null);
    setPreviewData(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v4/upload/revision/preview`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      setUploading(false);

      if (res.ok) {
        const result = await res.json();
        setPreviewData(result);
        setUploadMessage('Preview generated successfully!');
        setScormFile(null);
        setExcelFile(null);
      } else {
        const result = await res.json();
        setError(result.message || 'Upload failed.');
      }
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Unknown upload error');
    }
  };

  return (
    <>
      <Head>
        <title>Upload Revision Files (Preview)</title>
        <meta name="description" content="Upload SCORM and Excel files for revision preview" />
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-red-700">
        <div className="w-full max-w-md p-8 bg-white rounded shadow">
          <h1 className="text-2xl font-bold mb-6 text-center">Preview Upload Revision Files</h1>

          <form onSubmit={handleSubmit}>
            <fieldset disabled={uploading} className="flex flex-col gap-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700">SCORM Original File (.zip)</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleScormChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
                />
                {scormFile && (
                  <p className="text-sm text-gray-500 mt-1">Selected: {scormFile.name}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Excel File (.xlsx)</label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleExcelChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-green-50 file:text-green-700"
                />
                {excelFile && (
                  <p className="text-sm text-gray-500 mt-1">Selected: {excelFile.name}</p>
                )}
              </div>

              <button
                type="submit"
                className="bg-yellow-800 text-white py-2 rounded hover:bg-yellow-700 transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload & Preview'}
              </button>
            </fieldset>
          </form>

          {uploadMessage && (
            <p className="mt-4 text-green-600 text-center">{uploadMessage}</p>
          )}
          {error && (
            <p className="mt-4 text-red-600 text-center">{error}</p>
          )}

          {previewData && (
            <div className="mt-6 bg-gray-100 p-4 rounded">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Preview Results</h2>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
