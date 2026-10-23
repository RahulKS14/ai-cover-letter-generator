const multer = require('multer');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

// Configure Multer for memory storage with a 4MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Process multipart/form-data via multer if req.file is not already populated
    if (!req.file) {
      await runMiddleware(req, res, upload.single('resume'));
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No PDF file was uploaded.' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text || '';
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
    console.error('Error parsing PDF resume:', error.message || error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'PDF file size exceeds 4MB limit for serverless functions.'
      });
    }
    return res.status(500).json({
      error: 'Failed to extract text from PDF: ' + (error.message || 'Unknown error')
    });
  }
};

// Disable Vercel's default body parser so Multer can stream multipart/form-data
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
