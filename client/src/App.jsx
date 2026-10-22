import React, { useState } from 'react';
import { Sparkles, FileText, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import CoverLetterForm from './components/CoverLetterForm';
import OutputDisplay from './components/OutputDisplay';
import { generateTemplateCoverLetter } from './utils/templateGenerator';

const SAMPLE_DATA = {
  candidateName: 'Alex Morgan',
  jobRole: 'Senior Full Stack Engineer',
  targetCompany: 'Vercel',
  keySkills: 'React, Next.js, TypeScript, Node.js, Distributed Systems, Performance Optimization, Developer Experience (DX)',
};

export default function App() {
  const [formData, setFormData] = useState({
    candidateName: '',
    jobRole: '',
    targetCompany: '',
    keySkills: '',
  });

  const [useAI, setUseAI] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [sourceType, setSourceType] = useState(null); // 'ai' | 'template'
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (apiError) setApiError(null);
  };

  const handleResumeParsed = (parsedData) => {
    setResumeFile({
      name: parsedData.name,
      size: parsedData.size,
      charCount: parsedData.charCount,
    });
    setResumeText(parsedData.text);
    if (apiError) setApiError(null);
  };

  const handleResumeRemoved = () => {
    setResumeFile(null);
    setResumeText('');
  };

  const handleFillSample = () => {
    setFormData(SAMPLE_DATA);
    if (apiError) setApiError(null);
  };

  const handleReset = () => {
    setFormData({
      candidateName: '',
      jobRole: '',
      targetCompany: '',
      keySkills: '',
    });
    setCoverLetter('');
    setSourceType(null);
    setApiError(null);
    handleResumeRemoved();
  };

  const handleGenerate = async () => {
    setApiError(null);

    // Phase 1: Hardcoded template interpolation (no API)
    if (!useAI) {
      const templateResult = generateTemplateCoverLetter({
        candidateName: formData.candidateName,
        jobRole: formData.jobRole,
        targetCompany: formData.targetCompany,
        keySkills: formData.keySkills,
        resumeText: resumeText,
      });
      setCoverLetter(templateResult);
      setSourceType('template');
      return;
    }

    // AI Generation via Gemini API backend
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: formData.candidateName,
          jobRole: formData.jobRole,
          targetCompany: formData.targetCompany,
          keySkills: formData.keySkills,
          resumeText: resumeText || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate cover letter.');
      }

      setCoverLetter(data.coverLetter);
      setSourceType('ai');
    } catch (err) {
      console.error('Generation error:', err);
      setApiError(err.message || 'An error occurred while generating your cover letter.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Navbar Header */}
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="logo-badge">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <h1 className="brand-title">AI Cover Letter Generator</h1>
              <p className="brand-subtitle">
                React (Vite) + Express + Google Gemini 3.8 Flash
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="security-tag" title="API key secured server-side only in .env">
              <ShieldCheck size={14} className="mr-1 text-emerald-500" />
              Key Secured Server-side
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {apiError && (
          <div className="global-error-banner mb-6">
            <AlertCircle size={20} className="shrink-0 mr-3 text-rose-500" />
            <div className="text-sm">
              <p className="font-semibold text-rose-700 dark:text-rose-300">Generation Failed</p>
              <p className="text-rose-600 dark:text-rose-400 mt-0.5">{apiError}</p>
              {apiError.includes('GEMINI_API_KEY') && (
                <p className="text-xs text-rose-500 mt-1">
                  Tip: Toggle off <strong>&ldquo;Use AI&rdquo;</strong> to test Phase 1 local template generation without an API key, or add your key to <code>server/.env</code>.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="workspace-grid">
          {/* Left Column: Input Form & Resume */}
          <div className="grid-col-form">
            <CoverLetterForm
              formData={formData}
              onChange={handleInputChange}
              useAI={useAI}
              onToggleAI={setUseAI}
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
              resumeFile={resumeFile}
              resumeText={resumeText}
              onResumeParsed={handleResumeParsed}
              onResumeRemoved={handleResumeRemoved}
              onFillSample={handleFillSample}
              onReset={handleReset}
            />
          </div>

          {/* Right Column: Generated Letter Output */}
          <div className="grid-col-output">
            <OutputDisplay
              coverLetter={coverLetter}
              isGenerating={isGenerating}
              sourceType={sourceType}
              candidateName={formData.candidateName}
              targetCompany={formData.targetCompany}
              jobRole={formData.jobRole}
              onRegenerate={coverLetter ? handleGenerate : null}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted">
          <p>AI Cover Letter Generator • Powered by Google Gemini 3.8 Flash</p>
          <p className="mt-1 sm:mt-0">
            Phase 1 Template + Phase 2 LLM with PDF Parsing
          </p>
        </div>
      </footer>
    </div>
  );
}
