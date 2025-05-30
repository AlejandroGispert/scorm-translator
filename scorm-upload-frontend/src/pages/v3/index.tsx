import { useState } from 'react';
import Head from 'next/head';

export default function UploadRevision() {
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScormFile(e.target.files?.[0] || null);
    setUploadUrl(null);
    setError(null);
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExcelFile(e.target.files?.[0] || null);
    setUploadUrl(null);
    setError(null);
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
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v3/upload/revision`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
  
      setUploading(false);
  
      if (res.ok && res.headers.get('content-type') === 'application/zip') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = 'revision-pack.zip'; // Customize this as needed
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
  
        setUploadUrl('Revision files downloaded successfully!');
        setScormFile(null);
        setExcelFile(null);
      } else {
        const result = await res.json();
        setError(result.message || 'Upload succeeded but no zip file received.');
      }
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Unknown upload error');
    }
  };
  

  return (
    <>
      <Head>
        <title>Upload Revision Files</title>
        <meta name="description" content="Upload both SCORM and Excel files for revision" />
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-yellow-700">
        <div className="w-full max-w-md p-8 bg-white rounded shadow">
          <h1 className="text-2xl font-bold mb-6 text-center">Upload Revision Files</h1>

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
                {scormFile && <p className="text-sm text-gray-500 mt-1">Selected: {scormFile.name}</p>}
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Excel File (.xlsx)</label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleExcelChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-green-50 file:text-green-700"
                />
                {excelFile && <p className="text-sm text-gray-500 mt-1">Selected: {excelFile.name}</p>}
              </div>

              <button
                type="submit"
                className="bg-yellow-800 text-white py-2 rounded hover:bg-yellow-700 transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Revision'}
              </button>
            </fieldset>
          </form>

          {uploadUrl && <p className="mt-4 text-green-600 text-center">{uploadUrl}</p>}
          {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
        </div>
      </div>
    </>
  );
}
