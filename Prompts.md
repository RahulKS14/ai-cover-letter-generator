# Prompts & Model Architecture Documentation

This document records the exact tools, prompts, system instructions, variable injection logic, output processing, and security practices for the AI Cover Letter Generator.

---

## 1. Tools Used

- **AI Coding Agent**: Antigravity (Google DeepMind advanced agentic coding assistant)
- **Gemini Model**: `gemini-3.8-flash` (called via `@google/genai` in `server/index.js`)

---

## 2. Prompts Given to the Coding Agent

### Prompt 1: Initial Build Request

```text
Build an "AI Cover Letter Generator" with React (Vite) + Express.

Frontend:
- Form: Candidate Name, Job Role, Target Company, Key Skills (onChange state)
- Phase 1: a function that interpolates the form state into a hardcoded
  template string (no API), toggled by a "Use AI" checkbox
- Output component with a working "Copy to Clipboard" button
- "Generating..." loading state while waiting for the API
- Resume upload (PDF, button + drag-drop)
- Render LLM markdown as clean HTML <p> paragraphs, not one text block

Backend (Express):
- POST /api/generate -> calls Google Gemini API, injecting the form
  variables into a system prompt
- POST /api/parse-resume -> extracts PDF text with pdf-parse, and the
  resume text is appended to the LLM payload

Security (critical):
- API key only in server-side .env as GEMINI_API_KEY (no VITE_ prefix)
- Create .env.example and add .env to .gitignore BEFORE any git commit
- Never print or commit the key

Also create Prompts.md documenting the prompts used, and a README.
```

### Prompt 2: Mobile Responsiveness Request

```text
Make the app mobile responsive, quickly. CSS-only changes, don't touch the logic, don't refactor, don't add new features.

- Ensure <meta name="viewport" content="width=device-width, initial-scale=1.0"> is in index.html
- Below 820px, stack the form and the letter preview into one column
- No horizontal scroll at 360px width
- Inputs, textarea, and buttons full width, input font-size 16px, buttons min 44px tall
- Action buttons (Copy, Download) and the resume dropzone should wrap on small screens

Make the edits and stop. Skip extra testing and long explanations.
```

---

## 3. System Prompt Sent to Gemini

The following system prompt is sent as `config.systemInstruction` in `server/index.js`:

```javascript
`You are an elite executive career advisor and professional cover letter writer.
Your objective is to craft a tailored, persuasive, and authentic cover letter for:
- Candidate Name: ${candidateName.trim()}
- Target Job Role: ${jobRole.trim()}
- Target Company: ${targetCompany.trim()}
- Key Skills to Emphasize: ${keySkills ? keySkills.trim() : 'Core competencies and relevant achievements'}

Writing Guidelines:
1. Tone: Confident, articulate, professional, and enthusiastic. Never robotic or clichéd.
2. Structure:
   - Formal date and salutation (e.g. "Dear Hiring Manager," or "Dear Hiring Team at ${targetCompany.trim()},").
   - Opening paragraph: Declare interest in the ${jobRole.trim()} role, hook the reader with alignment to ${targetCompany.trim()}'s mission or industry standing, and state value proposition.
   - 2-3 body paragraphs: Showcase relevant experience, skills (${keySkills || 'key technical and leadership abilities'}), and measurable impact. If resume content is provided, weave in specific achievements and metrics from it.
   - Closing paragraph: Express eagerness to discuss how the candidate will drive impact in the role, provide a polite call-to-action for an interview, and finish with a warm, professional sign-off followed by ${candidateName.trim()}.
3. Markdown output:
   - Output standard markdown paragraphs separated by double newlines.
   - You may use bold text for key achievements or company names where appropriate.
   - Do NOT wrap the letter in markdown code blocks or backticks. Return the cover letter text directly.`
```

---

## 4. Dynamic Variable Injection

When a user submits the form, the frontend sends a `POST /api/generate` request with:
`{ candidateName, jobRole, targetCompany, keySkills, resumeText }`.

In `server/index.js`, variables are injected at two levels:

1. **System Instruction**:
   - `candidateName.trim()` -> Sets target candidate identity.
   - `jobRole.trim()` -> Focuses role-specific framing.
   - `targetCompany.trim()` -> Directs company alignment and salutation.
   - `keySkills.trim()` -> Prioritizes core competencies to highlight.

2. **User Payload (`contents`)**:
   - Primary instruction formulated with candidate, role, and company:
     ```javascript
     let userPrompt = `Please write a customized, high-impact cover letter for ${candidateName} applying for the ${jobRole} position at ${targetCompany}.`;
     if (keySkills && keySkills.trim()) {
       userPrompt += `\nKey skills to highlight: ${keySkills.trim()}`;
     }
     ```
   - **Resume Text Appending**: When a user uploads a PDF resume, `POST /api/parse-resume` extracts its text via `pdf-parse`. If `resumeText` is present in the generate request, it is appended directly to the user prompt payload:
     ```javascript
     if (resumeText && resumeText.trim()) {
       userPrompt += `\n\n=== CANDIDATE RESUME / EXPERIENCE DETAILS ===\n${resumeText.trim()}\n=== END RESUME ===\n\nPlease incorporate relevant highlights, accomplishments, and skills from the resume above to make this letter uniquely personalized and persuasive.`;
     }
     ```

---

## 5. Output Handling

Rather than rendering the model's markdown as an unformatted monospace wall of text, `client/src/components/MarkdownParagraphs.jsx` processes the string:

1. **Paragraph Splitting**: Normalizes line breaks and splits text by double newlines (`normalized.split(/\n{2,}/)`).
2. **Semantic Paragraphs (`<p>`)**: Wraps each text block in a dedicated `<p className="cover-letter-paragraph">` element with proper spacing and line height.
3. **Headings & Bulleted Lists**: Blocks starting with `#` are rendered as headings (`<h4>`), and blocks matching list items are mapped into `<ul><li className="cover-letter-list-item">`.
4. **Inline Markdown Parsing**:
   - `**bold**` or `__bold__` is rendered as `<strong className="font-semibold">`.
   - `*italic*` or `_italic_` is rendered as `<em className="italic">`.
   - Single line breaks inside a block are rendered with `<br />`.

---

## 6. Iteration Log

- **Initial Implementation**:
  - Initialized project repository with `.gitignore` and `.env.example`.
  - Created Express backend with `POST /api/generate` (`@google/genai` model `gemini-3.8-flash`) and `POST /api/parse-resume` (`pdf-parse`, `multer` memory storage).
  - Built React (Vite) client featuring candidate form, Phase 1 offline template fallback, PDF drag-and-drop upload, loading skeleton, clipboard copy, and `<p>` markdown paragraph renderer.
  - Resolved build error in `client/src/App.jsx` where non-existent icon export `Github` was imported from `lucide-react`.
- **Iteration 1 (Mobile Responsiveness)**:
  - Applied CSS-only mobile responsiveness in `client/src/index.css`.
  - Added single-column layout switch below 820px (`@media (max-width: 820px)`).
  - Ensured no horizontal scroll at 360px viewport width (`overflow-x: hidden`, adjusted paper/card padding, and word break).
  - Made inputs, textarea, and submit buttons full width on mobile with `font-size: 16px` (preventing iOS auto-zoom) and minimum 44px button touch targets.
  - Allowed action buttons (Copy, Download) and resume dropzone to wrap gracefully on narrow screens.

---

## 7. Security Notes

- **Server-Side API Key Only**: `GEMINI_API_KEY` is loaded exclusively inside `server/index.js` via `process.env.GEMINI_API_KEY`.
- **No `VITE_` Prefix**: The key is never prefixed with `VITE_`, preventing Vite from bundling it into the client application.
- **Git Protection**: `.env` and `server/.env` were added to `.gitignore` before any git commit was made. `.env.example` is committed as a template without secret values.
- **Browser Isolation**: The frontend issues requests to the local proxy endpoint `/api/generate`. The browser never interacts with the Google Gemini API directly and never receives or handles the API key.
- **Zero Logging of Credentials**: Server logging statements and error responses explicitly avoid printing or returning the API key.
