
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  
  return (
    <>
      <Head>
        <title>Choose Scorm Upload Page</title>
        <meta name="description" content="Created by Alejandro Gispert" />
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-blue-700">
        <div className="w-full max-w-md p-8 bg-white rounded shadow flex gap-4">
          <h1 className="text-2xl font-bold text-center ">Choose Version</h1>
 
          <Link href="/v1">
            <button
             type="button"
              className="bg-blue-800  px-4 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
            version 1<br/>AWS
            </button>
            </Link>

            <Link href="/v2">
            <button
              type="button"
              className="bg-blue-800 px-4 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
            version 2<br/>MSFT
            </button>
            </Link>


        </div>
      </div>
    </>
  );
}
