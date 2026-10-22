const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const pdfParseModule = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configure Multer for memory storage (keep PDF in RAM, no disk leaks)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * Helper to safely extract text from PDF buffer using pdf-parse
 * Supports both v1 (function) and v2 (PDFParse class)
 */
async function extractTextFromPDF(buffer) {
  if (typeof pdfParseModule === 'function') {
    const data = await pdfParseModule(buffer);
    return data.text || '';
  } else if (pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text || '';
    } finally {
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    }
  } else {
    throw new Error('Unsupported pdf-parse module format');
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    status: 'ok',
    geminiConfigured: hasKey,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/parse-resume
 * Extracts plain text from an uploaded PDF resume file.
 */
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No PDF file was uploaded.' });
    }

    const text = await extractTextFromPDF(req.file.buffer);
    const cleanedText = text.replace(/\r\n/g, '\n').trim();

    if (!cleanedText) {
      return res.status(422).json({
        error: 'Could not extract text from the PDF. The file may be an image-only scan or password-protected.'
      });
    }

    return res.json({
      success: true,
      filename: req.file.originalname,
      charCount: cleanedText.length,
      text: cleanedText
    });
  } catch (error) {
    console.error('Error parsing PDF resume:', error.message);
    return res.status(500).json({
      error: 'Failed to extract text from PDF: ' + error.message
    });
  }
});

/**
 * POST /api/generate
 * Calls Google Gemini API injecting form variables into a system prompt.
 * Appends resume text to the payload if provided.
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { candidateName, jobRole, targetCompany, keySkills, resumeText } = req.body;

    if (!candidateName || !jobRole || !targetCompany) {
      return res.status(400).json({
        error: 'Missing required fields: Candidate Name, Job Role, and Target Company are required.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured in server/.env. Please set a valid Gemini API key in server/.env to use AI generation.'
      });
    }

    // Build the dynamic system prompt injecting the form variables
    const systemInstruction = `You are an elite executive career advisor and professional cover letter writer.
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
   - Do NOT wrap the letter in markdown code blocks or backticks. Return the cover letter text directly.`;

    // Build user content payload, appending resume text if present
    let userPrompt = `Please write a customized, high-impact cover letter for ${candidateName} applying for the ${jobRole} position at ${targetCompany}.`;
    
    if (keySkills && keySkills.trim()) {
      userPrompt += `\nKey skills to highlight: ${keySkills.trim()}`;
    }

    if (resumeText && resumeText.trim()) {
      userPrompt += `\n\n=== CANDIDATE RESUME / EXPERIENCE DETAILS ===\n${resumeText.trim()}\n=== END RESUME ===\n\nPlease incorporate relevant highlights, accomplishments, and skills from the resume above to make this letter uniquely personalized and persuasive.`;
    }

    // Initialize Gemini API client
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const outputText = response.text;

    if (!outputText) {
      return res.status(502).json({ error: 'The AI model returned an empty response. Please try again.' });
    }

    return res.json({
      success: true,
      coverLetter: outputText
    });
  } catch (error) {
    // Never print or leak the API key in logs or response
    console.error('Error during cover letter generation:', error.message || error);
    return res.status(500).json({
      error: error.message || 'An error occurred while communicating with the Gemini API.'
    });
  }
});

// Error handling middleware for file upload limits
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
