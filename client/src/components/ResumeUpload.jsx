import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function ResumeUpload({
  resumeFile,
  resumeText,
  onResumeParsed,
  onResumeRemoved,
  disabled
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileProcess = async (file) => {
    setUploadError(null);

    if (!file) return;

    // Validate PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadError('Please select a valid PDF file (.pdf).');
      return;
    }

    // Limit to 4MB (Vercel serverless request body limit)
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('PDF file size exceeds 4MB limit for serverless functions.');
      return;
    }

    try {
      setIsParsing(true);
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text from PDF');
      }

      onResumeParsed({
        name: file.name,
        size: file.size,
        charCount: data.charCount,
        text: data.text,
      });
    } catch (err) {
      console.error('Resume upload error:', err);
      setUploadError(err.message || 'Error parsing PDF resume.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isParsing) {
      setIsDragging(true);
    }
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isParsing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="resume-upload-container">
      <div className="flex items-center justify-between mb-2">
        <label className="section-label">
          Resume Upload <span className="text-xs text-muted font-normal">(Optional PDF)</span>
        </label>
        {resumeFile && (
          <span className="badge-success">
            <CheckCircle2 size={13} className="mr-1" />
            Resume Attached
          </span>
        )}
      </div>

      {!resumeFile ? (
        <div
          className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${
            disabled ? 'dropzone-disabled' : ''
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && !isParsing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || isParsing}
          />

          {isParsing ? (
            <div className="flex flex-col items-center py-4">
              <Loader2 className="animate-spin text-accent mb-2" size={32} />
              <p className="text-sm font-medium">Extracting text from PDF...</p>
              <p className="text-xs text-muted">Using pdf-parse</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="upload-icon-wrapper mb-2">
                <UploadCloud size={24} className="text-accent" />
              </div>
              <p className="text-sm font-medium mb-1">
                <span className="text-accent hover:underline cursor-pointer">Click to browse</span> or drag & drop PDF
              </p>
              <p className="text-xs text-muted">PDF files up to 4MB • Text extracted automatically</p>
            </div>
          )}
        </div>
      ) : (
        <div className="attached-resume-card">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="resume-icon-pill">
              <FileText size={20} className="text-accent" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium truncate">{resumeFile.name}</p>
              <p className="text-xs text-muted">
                {(resumeFile.size / 1024).toFixed(1)} KB • {resumeFile.charCount?.toLocaleString() || resumeText.length.toLocaleString()} characters extracted
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResumeRemoved}
            className="remove-resume-btn"
            title="Remove attached resume"
            aria-label="Remove attached resume"
            disabled={disabled}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="error-banner mt-2">
          <AlertCircle size={16} className="shrink-0 mr-1.5" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
