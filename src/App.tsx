import { useState, useEffect } from "react";
import TurndownService from "turndown";

const DEBUG = false;

function App() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [hasMain, setHasMain] = useState<boolean>(false);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  // Check if main tag and selection exist
  useEffect(() => {
    const checkPageContent = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab.id) return;

        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return {
              hasMain: !!document.querySelector("main"),
              hasSelection: !!window.getSelection()?.toString(),
            };
          },
        });

        setHasMain(result[0].result?.hasMain || false);
        setHasSelection(result[0].result?.hasSelection || false);
      } catch (err) {
        setError("Failed to check page content: " + (err as Error).message);
      }
    };

    checkPageContent();
  }, []);

  const convertToMarkdown = async (source: "body" | "main" | "selection") => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) throw new Error("No active tab found");

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (source) => {
          // Get the title
          const title = document.title;
          let content = "";

          switch (source) {
            case "body":
              content = document.body.innerHTML;
              break;
            case "main":
              const mainElement = document.querySelector("main");
              content = mainElement?.innerHTML || "";
              break;
            case "selection": {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = document.createElement("div");
                container.appendChild(range.cloneContents());
                content = container.innerHTML;
              }
              break;
            }
          }

          // For body and main, we need to clean up scripts and styles
          if (source !== "selection") {
            const temp = document.createElement("div");
            temp.innerHTML = content;

            const scripts = temp.getElementsByTagName("script");
            const styles = temp.getElementsByTagName("style");

            for (let i = scripts.length - 1; i >= 0; i--) {
              scripts[i].remove();
            }
            for (let i = styles.length - 1; i >= 0; i--) {
              styles[i].remove();
            }

            content = temp.innerHTML;
          }

          return {
            title,
            content,
          };
        },
        args: [source],
      });

      const { title, content } = result[0].result as {
        title: string;
        content: string;
      };

      const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        emDelimiter: "_",
      });

      turndownService.addRule("removeStyles", {
        filter: ["style", "script"],
        replacement: () => "",
      });

      // Combine title and content
      const md =
        source === "selection"
          ? turndownService.turndown(content)
          : `# ${title}\n\n${turndownService.turndown(content)}`;

      setMarkdown(md);
      setSuccess("Website converted to Markdown!");
      setError(null);
    } catch (err) {
      setError("Failed to convert website: " + (err as Error).message);
      setSuccess(null);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setSuccess("Markdown copied to clipboard!");
      setError(null);
    } catch (err) {
      setError("Failed to copy to clipboard: " + (err as Error).message);
      setSuccess(null);
    }
  };

  const downloadMarkdown = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) throw new Error("No active tab found");

      const titleResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Get the title
          const title = document.title;

          return {
            title,
          };
        },
      });

      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titleResult[0].result?.title}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("Markdown file downloaded!");
      setError(null);
    } catch (err) {
      setError("Failed to download file: " + (err as Error).message);
      setSuccess(null);
    }
  };

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
            onClick={() => convertToMarkdown("body")}
            className="w-[220px] px-4 py-2 bg-[#9351EF] hover:bg-[#8043d2] text-white text-sm font-bold rounded-md"
          >
            Convert Entire Page
          </button>

          {hasMain && (
            <button
              onClick={() => convertToMarkdown("main")}
              className="w-[220px] px-4 py-2 bg-[#9351EF] hover:bg-[#8043d2] text-white text-sm font-bold rounded-md"
            >
              Convert Main Content
            </button>
          )}

          {hasSelection && (
            <button
              onClick={() => convertToMarkdown("selection")}
              className="w-[220px] px-4 py-2 bg-[#9351EF] hover:bg-[#8043d2] text-white text-sm font-bold rounded-md"
            >
              Convert Selection
            </button>
          )}

          {markdown && (
            <>
              <button
                onClick={copyToClipboard}
                className="w-[220px] px-4 py-2 bg-[#9351EF] hover:bg-[#8043d2] text-white text-sm font-bold rounded-md"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={downloadMarkdown}
                className="w-[220px] px-4 py-2 bg-[#9351EF] hover:bg-[#8043d2] text-white text-sm font-bold rounded-md"
              >
                Download Markdown
              </button>
            </>
          )}
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
