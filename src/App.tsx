import { useState, useEffect } from "react";

const DEBUG = false;

function App() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-[300px] min-w-[500px] bg-[#e7d5f8]">
      <div className="container mx-auto p-4 flex flex-col items-center">
        <div className="w-full flex justify-end mb-4"></div>

        <img
          src="logo.png"
          alt="Website To Markdown"
          className="w-[80px] h-[80px] mb-4"
        />
        <h1 className="text-xl font-bold mb-4 text-[#222]">
          Website To Markdown
        </h1>
        <div className="flex flex-col items-center gap-4 justify-center mb-4">
          {/* Debug buttons */}
          {DEBUG ? <></> : null}
          <button
            onClick={() => {}}
            disabled={false}
            className="w-[220px] px-4 py-2 bg-[#9351EF] hover:bg-[#8043d2] text-white text-sm font-bold rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Convert Website to Markdown
          </button>
        </div>
        {success && (
          <div className="text-green-500 text-sm text-center p-4 bg-green-50 rounded-md border border-green-200">
            {success}
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm text-center p-4 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
