# AI Cover Letter Generator — Prompt Engineering Documentation

This document describes the prompt architecture, system instructions, dynamic variable injection, and payload structuring used in the AI Cover Letter Generator powered by **Google Gemini 3.8 Flash**.

---

## 1. Architecture Overview

The application utilizes a two-stage prompt engineering pattern:
1. **System Instruction**: Injects candidate persona, job parameters, tone, professional structural guidelines, and markdown output rules at the system level.
2. **User Content Payload**: Supplies the candidate's core application intent and conditionally appends extracted PDF resume content as contextual reference material.

---

## 2. Dynamic System Instruction (`systemInstruction`)

The system prompt is injected dynamically per generation request on the server (`server/index.js`). Form variables (`candidateName`, `jobRole`, `targetCompany`, and `keySkills`) are interpolated into the system prompt to anchor the LLM's persona and context.

### System Prompt Template

```text
You are an elite executive career advisor and professional cover letter writer.
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
   - Do NOT wrap the letter in markdown code blocks or backticks. Return the cover letter text directly.
```

---

## 3. User Payload Structure

The user prompt contains the explicit task and incorporates resume text extracted via `pdf-parse` when a PDF has been uploaded by the candidate.

### Case A: Without Resume Attached

```text
Please write a customized, high-impact cover letter for Alex Morgan applying for the Senior Full Stack Engineer position at Vercel.
Key skills to highlight: React, Next.js, TypeScript, Node.js, Distributed Systems, Performance Optimization, Developer Experience (DX)
```

### Case B: With Extracted PDF Resume Attached

```text
Please write a customized, high-impact cover letter for Alex Morgan applying for the Senior Full Stack Engineer position at Vercel.
Key skills to highlight: React, Next.js, TypeScript, Node.js, Distributed Systems, Performance Optimization, Developer Experience (DX)

=== CANDIDATE RESUME / EXPERIENCE DETAILS ===
[Extracted plain text from candidate's uploaded PDF resume via pdf-parse]
=== END RESUME ===

Please incorporate relevant highlights, accomplishments, and skills from the resume above to make this letter uniquely personalized and persuasive.
```

---

## 4. Phase 1 Local Fallback Template (Offline / No-API)

When the **"Use AI"** checkbox is toggled off, the frontend runs Phase 1 client-side interpolation (`client/src/utils/templateGenerator.js`) with zero API dependency:

```javascript
/**
 * Hardcoded template string interpolation
 */
export function generateTemplateCoverLetter({ candidateName, jobRole, targetCompany, keySkills, resumeText }) {
  // Returns structured, formatted multi-paragraph cover letter
}
```

---

## 5. Output Formatting & Markdown-to-HTML Rules

To satisfy the requirement: *"Render LLM markdown as clean HTML `<p>` paragraphs, not one text block"*:

1. **Paragraph Segmentation**: Output is split by `\n{2,}` (double newlines) into individual block elements.
2. **Semantic Paragraphs**: Every regular text block is rendered as `<p className="cover-letter-paragraph">`.
3. **Inline Formatting**: Inline markdown tokens like `**bold**` are converted to `<strong>` and `*italic*` to `<em>`.
4. **Line Breaks**: Single newlines within a block (e.g., date or addresses) are rendered as `<br />`.
5. **Headings & Lists**: Markdown headers (`#`, `##`, `###`) render as semantic headings, and bullet points (`* `, `- `) render as `<ul><li>` lists.
