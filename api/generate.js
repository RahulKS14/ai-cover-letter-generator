const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { candidateName, jobRole, targetCompany, keySkills, resumeText } = body;

    if (!candidateName || !jobRole || !targetCompany) {
      return res.status(400).json({
        error: 'Missing required fields: Candidate Name, Job Role, and Target Company are required.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured in environment variables. Please set GEMINI_API_KEY to use AI generation.'
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
      model: 'gemini-3.6-flash',
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
};
