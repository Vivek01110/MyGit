import { useState, useMemo } from "react";
import {
  FileCode,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Columns,
  AlignJustify
} from "lucide-react";

/**
 * Computes line-by-line diff between oldText and newText using Myers/LCS approach.
 */
function computeLineDiff(oldText = "", newText = "") {
  const oldLines = oldText ? oldText.split("\n") : [];
  const newLines = newText ? newText.split("\n") : [];

  if (oldLines.length === 0 && newLines.length === 0) {
    return [];
  }

  // If newly added file
  if (oldLines.length === 0) {
    return newLines.map((line, idx) => ({
      type: "added",
      oldLineNum: null,
      newLineNum: idx + 1,
      content: line
    }));
  }

  // If deleted file
  if (newLines.length === 0) {
    return oldLines.map((line, idx) => ({
      type: "deleted",
      oldLineNum: idx + 1,
      newLineNum: null,
      content: line
    }));
  }

  // LCS Matrix DP
  const N = oldLines.length;
  const M = newLines.length;

  // For very large files, protect memory
  if (N * M > 250000) {
    // Simple line fallback
    const result = [];
    oldLines.forEach((l, i) =>
      result.push({ type: "deleted", oldLineNum: i + 1, newLineNum: null, content: l })
    );
    newLines.forEach((l, i) =>
      result.push({ type: "added", oldLineNum: null, newLineNum: i + 1, content: l })
    );
    return result;
  }

  const dp = Array.from({ length: N + 1 }, () => new Uint16Array(M + 1));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build diff
  let i = N;
  let j = M;
  const diff = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.push({
        type: "unchanged",
        oldLineNum: i,
        newLineNum: j,
        content: oldLines[i - 1]
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({
        type: "added",
        oldLineNum: null,
        newLineNum: j,
        content: newLines[j - 1]
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.push({
        type: "deleted",
        oldLineNum: i,
        newLineNum: null,
        content: oldLines[i - 1]
      });
      i--;
    }
  }

  return diff.reverse();
}

/**
 * Builds pairs of left/right rows for side-by-side split diff view
 */
function buildSplitRows(diffLines) {
  const rows = [];
  let leftBuffer = [];
  let rightBuffer = [];

  const flushBuffers = () => {
    const maxLen = Math.max(leftBuffer.length, rightBuffer.length);
    for (let k = 0; k < maxLen; k++) {
      rows.push({
        left: leftBuffer[k] || null,
        right: rightBuffer[k] || null
      });
    }
    leftBuffer = [];
    rightBuffer = [];
  };

  for (const line of diffLines) {
    if (line.type === "unchanged") {
      flushBuffers();
      rows.push({ left: line, right: line });
    } else if (line.type === "deleted") {
      leftBuffer.push(line);
    } else if (line.type === "added") {
      rightBuffer.push(line);
    }
  }
  flushBuffers();
  return rows;
}

export default function DiffViewer({
  file,
  viewMode = "unified", // 'unified' | 'split'
  defaultExpanded = true
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const diffLines = useMemo(() => {
    return computeLineDiff(file.oldContent, file.newContent);
  }, [file.oldContent, file.newContent]);

  const splitRows = useMemo(() => {
    if (viewMode === "split") {
      return buildSplitRows(diffLines);
    }
    return [];
  }, [diffLines, viewMode]);

  const handleCopyPath = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge =
    file.status === "added" ? (
      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
        ADDED
      </span>
    ) : file.status === "deleted" ? (
      <span className="rounded bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400 border border-red-500/20">
        DELETED
      </span>
    ) : (
      <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-accent-blue border border-blue-500/20">
        MODIFIED
      </span>
    );

  return (
    <div
      id={`file-${file.filePath.replace(/[^a-zA-Z0-9_-]/g, "-")}`}
      className="card-surface overflow-hidden rounded-xl border border-border transition-all scroll-mt-20"
    >
      {/* File Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex cursor-pointer items-center justify-between border-b border-border bg-canvas/90 px-4 py-2.5 text-xs text-fg select-none hover:bg-canvas"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            className="text-fg-muted hover:text-fg p-0.5"
            aria-label={isExpanded ? "Collapse file" : "Expand file"}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <FileCode size={16} className="text-accent-blue shrink-0" />

          <span className="font-mono font-medium text-fg truncate text-sm">
            {file.filePath}
          </span>

          {statusBadge}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Additions / Deletions count */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {file.additions > 0 && (
              <span className="text-emerald-400 font-medium">+{file.additions}</span>
            )}
            {file.deletions > 0 && (
              <span className="text-red-400 font-medium">-{file.deletions}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyPath}
            title="Copy file path"
            className="flex items-center gap-1 rounded p-1 text-fg-muted hover:bg-canvas hover:text-fg border border-transparent hover:border-border transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Diff Content Body */}
      {isExpanded && (
        <div className="overflow-x-auto bg-[#0d1117] font-mono text-[12px] leading-5">
          {diffLines.length === 0 ? (
            <div className="p-4 text-center text-fg-muted italic">
              Empty file or no content changes.
            </div>
          ) : viewMode === "split" ? (
            /* SIDE-BY-SIDE SPLIT VIEW */
            <table className="w-full border-collapse">
              <tbody>
                {splitRows.map((row, idx) => {
                  const left = row.left;
                  const right = row.right;

                  const leftBg =
                    left?.type === "deleted"
                      ? "bg-red-950/40 text-red-200"
                      : left?.type === "unchanged"
                      ? "text-fg"
                      : "bg-[#0d1117] text-transparent";

                  const rightBg =
                    right?.type === "added"
                      ? "bg-emerald-950/40 text-emerald-200"
                      : right?.type === "unchanged"
                      ? "text-fg"
                      : "bg-[#0d1117] text-transparent";

                  return (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      {/* Left side (Old / Target) */}
                      <td className="w-10 select-none border-r border-border/40 bg-canvas/30 px-2 text-right text-[11px] text-fg-subtle">
                        {left?.oldLineNum || ""}
                      </td>
                      <td className="w-4 select-none px-1 text-center font-bold text-red-400">
                        {left?.type === "deleted" ? "-" : ""}
                      </td>
                      <td className={`w-1/2 border-r border-border/50 px-2 py-0.5 whitespace-pre-wrap break-all ${leftBg}`}>
                        {left?.content || ""}
                      </td>

                      {/* Right side (New / Source) */}
                      <td className="w-10 select-none border-r border-border/40 bg-canvas/30 px-2 text-right text-[11px] text-fg-subtle">
                        {right?.newLineNum || ""}
                      </td>
                      <td className="w-4 select-none px-1 text-center font-bold text-emerald-400">
                        {right?.type === "added" ? "+" : ""}
                      </td>
                      <td className={`w-1/2 px-2 py-0.5 whitespace-pre-wrap break-all ${rightBg}`}>
                        {right?.content || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* UNIFIED INLINE VIEW */
            <table className="w-full border-collapse">
              <tbody>
                {diffLines.map((line, idx) => {
                  const isAdded = line.type === "added";
                  const isDeleted = line.type === "deleted";

                  const rowClass = isAdded
                    ? "bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/40"
                    : isDeleted
                    ? "bg-red-950/30 text-red-200 hover:bg-red-950/40"
                    : "text-fg hover:bg-white/[0.02]";

                  const sign = isAdded ? "+" : isDeleted ? "-" : " ";
                  const signColor = isAdded
                    ? "text-emerald-400 font-bold"
                    : isDeleted
                    ? "text-red-400 font-bold"
                    : "text-fg-subtle";

                  return (
                    <tr key={idx} className={rowClass}>
                      {/* Old Line # */}
                      <td className="w-12 select-none border-r border-border/40 bg-canvas/30 px-2 text-right text-[11px] text-fg-subtle">
                        {line.oldLineNum || ""}
                      </td>
                      {/* New Line # */}
                      <td className="w-12 select-none border-r border-border/40 bg-canvas/30 px-2 text-right text-[11px] text-fg-subtle">
                        {line.newLineNum || ""}
                      </td>
                      {/* Sign indicator */}
                      <td className={`w-6 select-none px-1 text-center ${signColor}`}>
                        {sign}
                      </td>
                      {/* Line code content */}
                      <td className="px-2 py-0.5 whitespace-pre-wrap break-all font-mono">
                        {line.content}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
