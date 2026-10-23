const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const generateHandler = require('../api/generate');
const parseResumeHandler = require('../api/parse-resume');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing (JSON only affects application/json requests)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    status: 'ok',
    geminiConfigured: hasKey,
    timestamp: new Date().toISOString()
  });
});

// Mount the serverless handlers for local development
app.post('/api/generate', (req, res) => generateHandler(req, res));
app.post('/api/parse-resume', (req, res) => parseResumeHandler(req, res));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
