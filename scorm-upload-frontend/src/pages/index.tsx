import { useState } from 'react';


export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('scorm', file);

    setUploading(true);
    setError(null);

    try {
      const res = await fetch('process.env.NEXT_PUBLIC_API_URL/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 200 && res.headers.get('content-type') === 'application/zip') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translated-scorm.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        setUploadUrl('Download started!');
      } else {
        let result = {};
        try {
          result = await res.json();
        } catch {
          result = { message: await res.text() };
        }
        setError(result.message || 'Something went wrong.');
      }
    } catch (err) {
      setError('File upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-700">
      <div className="w-full max-w-md p-8 bg-white rounded shadow ">
        <h1 className="text-2xl font-bold mb-6 text-center ">Upload SCORM File</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 ">
          <input type="file"   name="scorm" onChange={handleFileChange} className="file:mr-4    file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700" />
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-800 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
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
  );
}
