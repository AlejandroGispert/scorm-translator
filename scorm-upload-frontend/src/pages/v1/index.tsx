import { useState } from 'react';
import Head from 'next/head';


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadFinished, setDownloadFinished] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setUploadUrl(null);
    setError(null);
    setDownloadFinished(false);
    setUploading(false);
    setTranslating(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('scorm', file);

    setUploading(true);
    setTranslating(false);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL1}/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploading(false);
      setTranslating(true);

      if (res.status === 200 && res.headers.get('content-type') === 'application/zip') {
        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const originalName = file.name.replace(/\.zip$/i, '');
        const filename = `translated-${originalName}.zip`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setDownloadFinished(true);
        setUploadUrl('Download Started!');
      } else {
        setTranslating(false);
        let result: { message?: string } = {};
        try {
          result = await res.json();
        } catch {
          result = { message: await res.text() };
        }
        setError(result.message || 'Something went wrong.');
      }
    } catch (err) {
      setUploading(false);
      setTranslating(false);
      if (err instanceof Error) {
        setError('File upload failed: ' + err.message);
      } else {
        setError('File upload failed: Unknown error');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Scorm Upload Page</title>
        <meta name="description" content="Created by Alejandro Gispert" />
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-yellow-700">
        <div className="w-full max-w-md p-8 bg-white rounded shadow ">
          <h1 className="text-2xl font-bold mb-6 text-center ">Upload SCORM File</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 ">
            <input type="file"   name="scorm" onChange={handleFileChange} className="file:mr-4    file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700" />
            <button
              type="submit"
              disabled={uploading || translating}
              className="bg-blue-800 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {downloadFinished
                ? 'Done'
                : uploading
                  ? 'Uploading...'
                  : translating
                    ? 'Translating...'
                    : 'Upload'}
            </button>
          </form>

          {uploadUrl && (
            <div className="mt-4 text-green-600 text-center">
              <p>{uploadUrl}</p>
            </div>
          )}

          {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

        </div>
      </div>
    </>
  );
}
