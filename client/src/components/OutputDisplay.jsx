import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import MarkdownParagraphs from './MarkdownParagraphs';

export default function OutputDisplay({
  coverLetter,
  isGenerating,
  sourceType, // 'ai' or 'template'
  candidateName,
  targetCompany,
  jobRole,
  onRegenerate
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!coverLetter) return;
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    if (!coverLetter) return;
    const cleanCompany = (targetCompany || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanRole = (jobRole || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Cover_Letter_${cleanCompany}_${cleanRole}.txt`;

    const blob = new Blob([coverLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Word count & estimated reading time calculation
  const words = coverLetter ? coverLetter.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(words / 200);

  return (
    <div className="output-card">
      <div className="output-card-header">
        <div className="flex items-center space-x-2">
          <FileText size={18} className="text-accent" />
          <h2 className="section-title">Generated Cover Letter</h2>
          {sourceType === 'ai' && (
            <span className="badge-ai-pill">
              <Sparkles size={11} className="mr-1" />
              Gemini AI
            </span>
          )}
          {sourceType === 'template' && (
            <span className="badge-template-pill">
              Template (Phase 1)
            </span>
          )}
        </div>

        {coverLetter && !isGenerating && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className={`copy-btn ${copied ? 'copy-btn-success' : ''}`}
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check size={14} className="mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1.5" />
                  Copy to Clipboard
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="action-icon-btn"
              title="Download as text file"
            >
              <Download size={15} />
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="action-icon-btn"
                title="Regenerate"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="output-body">
        {isGenerating ? (
          <div className="generating-state">
            <div className="generating-spinner-box">
              <Loader2 size={36} className="animate-spin text-accent" />
            </div>
            <h3 className="text-base font-semibold mt-3">Generating Cover Letter...</h3>
            <p className="text-xs text-muted max-w-sm mt-1">
              Synthesizing your role requirements, key skills, and resume details with Gemini 3.8 Flash...
            </p>
            {/* Shimmering skeleton lines */}
            <div className="skeleton-container mt-6">
              <div className="skeleton-line skeleton-w-short" />
              <div className="skeleton-line skeleton-w-full" />
              <div className="skeleton-line skeleton-w-medium" />
              <div className="skeleton-line skeleton-w-full" />
              <div className="skeleton-line skeleton-w-short" />
            </div>
          </div>
        ) : coverLetter ? (
          <div className="letter-paper">
            {/* Render LLM markdown as clean HTML <p> paragraphs, not one text block */}
            <MarkdownParagraphs content={coverLetter} />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={36} className="text-muted" />
            </div>
            <h3 className="text-sm font-semibold mt-3">No cover letter generated yet</h3>
            <p className="text-xs text-muted max-w-xs mt-1">
              Fill in your candidate details, optionally drop your PDF resume, and click &ldquo;Generate&rdquo; to create a tailored letter.
            </p>
          </div>
        )}
      </div>

      {coverLetter && !isGenerating && (
        <div className="output-card-footer">
          <div className="flex items-center space-x-4 text-xs text-muted">
            <span><strong>{words}</strong> words</span>
            <span>•</span>
            <span>~<strong>{readingTime}</strong> min read</span>
            {targetCompany && (
              <>
                <span>•</span>
                <span className="truncate">For: <strong>{targetCompany}</strong></span>
              </>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-accent font-medium hover:underline flex items-center"
          >
            {copied ? 'Copied to clipboard' : 'Quick copy'}
          </button>
        </div>
      )}
    </div>
  );
}
