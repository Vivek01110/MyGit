import { useState, useMemo } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import {
  Copy,
  Check,
  Code2,
  FileText,
  Eye,
  WrapText,
  Maximize2,
  Minimize2
} from "lucide-react";

// Extension to Highlight.js language mapping
const EXTENSION_MAP = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  pyw: "python",
  html: "xml",
  htm: "xml",
  xml: "xml",
  svg: "xml",
  css: "css",
  scss: "scss",
  less: "less",
  json: "json",
  jsonc: "json",
  md: "markdown",
  markdown: "markdown",
  java: "java",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  c: "c",
  h: "c",
  hpp: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  php: "php",
  rb: "ruby",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  dockerfile: "dockerfile",
  env: "ini",
  ini: "ini",
  toml: "ini",
  graphql: "graphql",
  gql: "graphql",
  lua: "lua",
  swift: "swift",
  kt: "kotlin",
  dart: "dart"
};

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "ico",
  "bmp"
]);

export default function CodeViewer({
  filename = "",
  content = "",
  rawUrl = null,
  className = ""
}) {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [viewMode, setViewMode] = useState("code"); // "code" | "preview"
  const [activeLine, setActiveLine] = useState(null);

  // Extract file extension
  const extension = useMemo(() => {
    const parts = filename.toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() : "";
  }, [filename]);

  const isImage = IMAGE_EXTENSIONS.has(extension);
  const isMarkdown = extension === "md" || extension === "markdown";

  // Detect language
  const language = useMemo(() => {
    if (EXTENSION_MAP[extension]) {
      return EXTENSION_MAP[extension];
    }
    // Fallback: check by filename (e.g. Dockerfile)
    const base = filename.toLowerCase();
    if (base === "dockerfile") return "dockerfile";
    if (base.startsWith(".env")) return "ini";
    return null;
  }, [extension, filename]);

  // Syntax highlight content line-by-line
  const { highlightedLines, displayLang } = useMemo(() => {
    if (!content || typeof content !== "string") {
      return { highlightedLines: [], displayLang: "Text" };
    }

    try {
      let result;
      let detectedName = "Plain Text";

      if (language && hljs.getLanguage(language)) {
        result = hljs.highlight(content, { language, ignoreIllegals: true });
        detectedName = language.toUpperCase();
      } else {
        const auto = hljs.highlightAuto(content);
        result = auto;
        detectedName = auto.language ? auto.language.toUpperCase() : "Plain Text";
      }

      // Split the highlighted HTML back into lines
      // highlight.js returns a single HTML string with spans.
      // To keep line numbering perfectly synchronized, we split by \n
      const lines = result.value.split("\n");
      return { highlightedLines: lines, displayLang: detectedName };
    } catch (err) {
      console.warn("Syntax highlight failed, using plain lines", err);
      return {
        highlightedLines: content.split("\n"),
        displayLang: "Plain Text"
      };
    }
  }, [content, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = highlightedLines.length;

  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-canvas-inset font-mono text-xs shadow-inner ${className}`}>
      {/* Code Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-canvas-subtle/80 px-4 py-2.5 backdrop-blur">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <span className="rounded bg-canvas px-2 py-0.5 text-[11px] font-medium text-accent-blue border border-border/50">
            {displayLang}
          </span>
          <span className="text-[11px] text-fg-subtle">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Markdown preview toggle */}
          {isMarkdown && (
            <div className="flex rounded border border-border bg-canvas p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${viewMode === "code"
                    ? "bg-canvas-subtle text-fg font-medium"
                    : "text-fg-muted hover:text-fg"
                  }`}
              >
                <Code2 size={12} /> Code
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${viewMode === "preview"
                    ? "bg-canvas-subtle text-fg font-medium"
                    : "text-fg-muted hover:text-fg"
                  }`}
              >
                <Eye size={12} /> Preview
              </button>
            </div>
          )}

          {/* Wrap lines toggle */}
          <button
            type="button"
            onClick={() => setWrapLines(!wrapLines)}
            title={wrapLines ? "Unwrap lines" : "Wrap lines"}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors ${wrapLines
                ? "border-accent-blue/50 bg-accent-blue/10 text-accent-blue"
                : "border-border bg-canvas text-fg-muted hover:text-fg"
              }`}
          >
            <WrapText size={12} />
            <span className="hidden sm:inline">{wrapLines ? "Wrap: On" : "Wrap: Off"}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded border border-border bg-canvas px-2.5 py-1 text-[11px] text-fg-muted transition-colors hover:text-fg hover:border-fg-muted"
          >
            {copied ? (
              <>
                <Check size={12} className="text-accent-green" />
                <span className="text-accent-green">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isImage ? (
        <div className="flex flex-col items-center justify-center p-8 bg-[radial-gradient(#30363d_1px,transparent_1px)] [background-size:16px_16px]">
          {rawUrl ? (
            <img
              src={rawUrl}
              alt={filename}
              className="max-h-96 max-w-full rounded border border-border bg-canvas object-contain shadow-md"
            />
          ) : (
            <div className="text-fg-muted">Image file preview unavailable</div>
          )}
        </div>
      ) : isMarkdown && viewMode === "preview" ? (
        <div className="prose prose-invert max-w-none p-6 font-sans text-sm leading-relaxed text-fg bg-canvas">
          <div className="whitespace-pre-wrap font-sans text-sm text-fg">
            {content}
          </div>
        </div>
      ) : (
        /* VS Code Style Code View with Gutter */
        <div className="overflow-x-auto bg-[#0d1117] p-0 font-mono text-[13px] leading-6 selection:bg-accent-blue/30">
          <table className="w-full border-collapse">
            <tbody>
              {highlightedLines.map((lineHtml, index) => {
                const lineNum = index + 1;
                const isActive = activeLine === lineNum;

                return (
                  <tr
                    key={lineNum}
                    onClick={() => setActiveLine(isActive ? null : lineNum)}
                    className={`transition-colors duration-75 ${isActive
                        ? "bg-accent-blue/15"
                        : "hover:bg-[#161b22]/70"
                      }`}
                  >
                    {/* Line number gutter */}
                    <td className="w-12 min-w-[3rem] select-none border-r border-border/40 px-3 text-right font-mono text-xs text-[#6e7681] opacity-70">
                      {lineNum}
                    </td>

                    {/* Syntax highlighted code line */}
                    <td
                      className={`px-4 font-mono ${wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                        }`}
                    >
                      <code
                        className="hljs !bg-transparent !p-0 font-mono text-[13px]"
                        dangerouslySetInnerHTML={{
                          __html: lineHtml.length > 0 ? lineHtml : "&nbsp;"
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
