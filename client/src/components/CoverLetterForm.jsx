import React from 'react';
import { Sparkles, FileEdit, Wand2, RefreshCw, Loader2 } from 'lucide-react';
import ResumeUpload from './ResumeUpload';

export default function CoverLetterForm({
  formData,
  onChange,
  useAI,
  onToggleAI,
  onSubmit,
  isGenerating,
  resumeFile,
  resumeText,
  onResumeParsed,
  onResumeRemoved,
  onFillSample,
  onReset
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="cover-letter-form">
      <div className="form-header-row mb-4">
        <div>
          <h2 className="section-title">Candidate & Job Details</h2>
          <p className="text-xs text-muted">Fill in the fields below to customize your cover letter</p>
        </div>
        <button
          type="button"
          onClick={onFillSample}
          className="sample-btn"
          title="Fill with realistic sample data"
          disabled={isGenerating}
        >
          <Wand2 size={13} className="mr-1" />
          Sample Data
        </button>
      </div>

      <div className="input-group">
        <label htmlFor="candidateName" className="input-label">
          Candidate Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="candidateName"
          name="candidateName"
          type="text"
          required
          placeholder="e.g. Alex Morgan"
          value={formData.candidateName}
          onChange={onChange}
          disabled={isGenerating}
          className="form-input"
        />
      </div>

      <div className="grid-2-col">
        <div className="input-group">
          <label htmlFor="jobRole" className="input-label">
            Target Job Role <span className="text-rose-500">*</span>
          </label>
          <input
            id="jobRole"
            name="jobRole"
            type="text"
            required
            placeholder="e.g. Senior Fullstack Engineer"
            value={formData.jobRole}
            onChange={onChange}
            disabled={isGenerating}
            className="form-input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="targetCompany" className="input-label">
            Target Company <span className="text-rose-500">*</span>
          </label>
          <input
            id="targetCompany"
            name="targetCompany"
            type="text"
            required
            placeholder="e.g. Stripe, Google, Acme Corp"
            value={formData.targetCompany}
            onChange={onChange}
            disabled={isGenerating}
            className="form-input"
          />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="keySkills" className="input-label">
          Key Skills to Highlight
        </label>
        <textarea
          id="keySkills"
          name="keySkills"
          rows={3}
          placeholder="e.g. React, TypeScript, Node.js, System Architecture, Team Mentorship, Cloud Infrastructure (AWS/GCP)"
          value={formData.keySkills}
          onChange={onChange}
          disabled={isGenerating}
          className="form-textarea"
        />
        <p className="input-hint">List your strongest technical and soft skills to weave into the letter</p>
      </div>

      {/* Resume Upload Component */}
      <ResumeUpload
        resumeFile={resumeFile}
        resumeText={resumeText}
        onResumeParsed={onResumeParsed}
        onResumeRemoved={onResumeRemoved}
        disabled={isGenerating}
      />

      {/* AI Toggle Box */}
      <div className={`ai-toggle-box ${useAI ? 'ai-toggle-box-active' : ''}`}>
        <label className="ai-toggle-label">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => onToggleAI(e.target.checked)}
              disabled={isGenerating}
              className="toggle-checkbox"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">Use AI (Gemini 3.8 Flash)</span>
                {useAI ? (
                  <span className="badge-ai">
                    <Sparkles size={11} className="mr-1" />
                    AI Mode
                  </span>
                ) : (
                  <span className="badge-template">
                    <FileEdit size={11} className="mr-1" />
                    Phase 1: Local Template
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {useAI
                  ? 'Leverages Google Gemini API to write a tailored, professional letter using prompt engineering'
                  : 'Instant client-side template interpolation (Phase 1, no API call required)'}
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex items-center space-x-3 mt-4">
        <button
          type="submit"
          disabled={isGenerating || !formData.candidateName || !formData.jobRole || !formData.targetCompany}
          className={`submit-btn ${isGenerating ? 'submit-btn-loading' : ''}`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Generating Cover Letter...
            </>
          ) : useAI ? (
            <>
              <Sparkles size={18} className="mr-2" />
              Generate with Gemini AI
            </>
          ) : (
            <>
              <FileEdit size={18} className="mr-2" />
              Generate Template Letter
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={isGenerating}
          className="reset-btn"
          title="Clear form"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </form>
  );
}
