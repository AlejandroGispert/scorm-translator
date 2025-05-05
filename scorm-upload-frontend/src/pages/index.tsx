
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  
  return (
    <>
      <Head>
        <title>Choose Scorm Upload Page</title>
        <meta name="description" content="Created by Alejandro Gispert" />
      </Head>

      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-700">
        {/* Big Header */}
        <h1 className="text-4xl font-extrabold text-white mb-10 text-center">
          E-LEARNING SCORM TRANSLATOR
        </h1>

        <div className="w-full max-w-md p-8 bg-white rounded shadow flex flex-row gap-4 items-center">
          <h2 className="text-2xl font-bold text-center mb-4">Choose Version</h2>
<div className='flex flex-col gap-4'>
          <Link href="/v1">
            <button
              type="button"
              className="bg-blue-800  w-25 h-25 p-4 text-white  rounded hover:bg-blue-700 transition"
            >
              version<br />1<br />AWS
            </button>
          </Link>

          <Link href="/v2">
            <button
              type="button"
              className="bg-blue-800 w-25 h-25 p-4 text-white rounded hover:bg-blue-700 transition"
            >
              version<br />2<br />MSFT
            </button>
          </Link>
          </div>
          <div className='flex flex-col gap-4'>
          <Link href="/v3">
            <button
              type="button"
              className="bg-blue-800 w-25 h-25 p-4 text-white  rounded hover:bg-blue-700 transition"
            >
              Upload<br />
              <br />
              Revision
            </button>
          </Link>
          <Link href="/v4">
            <button
              type="button"
              className="bg-blue-800  w-25 h-25 p-4  text-white  rounded hover:bg-blue-700 transition"
            >
              Upload<br />
             
              Revision
              Preview
            </button>
          </Link></div>
        </div>
      </div>
    </>
  );
}