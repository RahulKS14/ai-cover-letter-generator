# AI Cover Letter Generator ✉️✨

A fullstack application built with **React (Vite)** and **Express** that generates highly tailored, professional cover letters using **Google Gemini 3.6 Flash** and client-side template interpolation.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.6_Flash-8e75ff?logo=google)
![License](https://img.shields.io/badge/License-MIT-green)

## 🔗 Live Demo

**[ai-cover-letter-generator-ten-psi.vercel.app](https://ai-cover-letter-generator-ten-psi.vercel.app/)**

---

## 🌟 Key Features

- **Dynamic Form Input**: Real-time controlled inputs for Candidate Name, Job Role, Target Company, and Key Skills (`onChange` state).
- **Phase 1 Template Toggle ("Use AI" Checkbox)**:
  - **Unchecked (Phase 1)**: Instant client-side string interpolation using a structured template without calling any API.
  - **Checked (AI Mode)**: Injects form parameters into a Gemini system instruction and sends the prompt to the backend LLM.
- **Resume Upload (PDF Drag & Drop + Button)**:
  - Drag-and-drop area or click-to-browse file picker for `.pdf` resumes.
  - Memory-safe PDF text extraction powered by `pdf-parse` on the server.
  - Extracted resume text is automatically appended to the LLM generation payload.
- **Clean HTML `<p>` Paragraph Rendering**:
  - Automatically parses LLM markdown and outputs clean semantic `<p>` HTML paragraphs, bold highlights, headings, and bulleted lists instead of an unformatted monospace text block.
- **Interactive Output Station**:
  - One-click **Copy to Clipboard** with visual feedback.
  - Download as text file (`.txt`).
  - Word count and estimated reading time.
  - Shimmering loading skeleton during API generation.
- **One-Click Sample Data**: Quickly pre-fill realistic details to test the generator immediately.

---

## 🔒 Security Best Practices

- **Zero Client-Side Leaks**: The Gemini API key is strictly stored server-side in `server/.env` as `GEMINI_API_KEY` (no `VITE_` prefix, never exposed to browser bundles).
- **Git Ignore**: `.env` is listed in `.gitignore` to prevent any accidental credentials commit.
- **Environment Template**: A `.env.example` file is provided for reference.
- **Safe Logging**: The server never prints, logs, or returns the raw API key in network responses or error traces.
- **In-Memory File Processing**: Uploaded PDF resumes are processed directly in memory buffer with `multer.memoryStorage()`, preventing temporary files from lingering on disk.

---

## 📂 Project Architecture

```
ai-cover-letter-generator/
├── .env.example              # Server environment variable template
├── .gitignore                # Protects .env, node_modules, dist, logs
├── package.json              # Root package with unified run scripts
├── Prompts.md                # System prompts & prompt engineering documentation
├── README.md                 # Project documentation
│
├── server/                   # Express Backend
│   ├── .env.example          # Backend environment example
│   ├── index.js              # Express API server with Gemini & pdf-parse
│   └── package.json          # Express, @google/genai, pdf-parse, multer, cors
│
└── client/                   # React Frontend (Vite)
    ├── vite.config.js        # Vite config with /api proxy to port 5000
    ├── index.html            # Main HTML document
    └── src/
        ├── App.jsx           # Main orchestrator component
        ├── index.css         # Modern, responsive styles & animations
        ├── components/
        │   ├── CoverLetterForm.jsx    # Candidate inputs & AI toggle
        │   ├── ResumeUpload.jsx       # PDF drag & drop file upload
        │   ├── OutputDisplay.jsx      # Cover letter stationery & copy button
        │   └── MarkdownParagraphs.jsx # Markdown-to-HTML <p> renderer
        └── utils/
            └── templateGenerator.js   # Phase 1 offline template interpolation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher; tested on Node v24)
- [npm](https://www.npmjs.com/) (v9 or higher)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env` and insert your Gemini API key:

```bash
# In the root directory or server directory:
cp .env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

> **Note:** If you run without setting an API key, you can still immediately use **Phase 1 (Local Template)** by leaving the "Use AI" checkbox unchecked!

### 3. Install Dependencies

You can install all dependencies from the root:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

cd ..
```

### 4. Run the Application

You can run both backend and frontend concurrently or in separate terminals:

#### Option A: Run concurrently from root
```bash
npm run dev
```

#### Option B: Separate terminals
Terminal 1 (Backend):
```bash
cd server
node index.js
# Runs Express on http://localhost:5000
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
# Runs Vite on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## 📡 API Endpoints

### 1. `POST /api/generate`
Generates a customized cover letter using Gemini 3.6 Flash.

- **Request Body (JSON):**
  ```json
  {
    "candidateName": "Alex Morgan",
    "jobRole": "Senior Full Stack Engineer",
    "targetCompany": "Vercel",
    "keySkills": "React, TypeScript, Node.js",
    "resumeText": "Optional extracted resume text..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "coverLetter": "Dear Hiring Team at Vercel, ..."
  }
  ```

### 2. `POST /api/parse-resume`
Extracts raw text content from an uploaded PDF file.

- **Request:** `multipart/form-data` with field `resume` containing a `.pdf` file.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "filename": "Alex_Morgan_Resume.pdf",
    "charCount": 3842,
    "text": "Full extracted plain text from PDF..."
  }
  ```

### 3. `GET /api/health`
Checks backend health and whether a valid `GEMINI_API_KEY` is detected.

---

## 🧪 Testing the Flows

1. **Phase 1 (Instant Local Template)**:
   - Click **"Sample Data"** to autofill the form.
   - Uncheck **"Use AI (Gemini 3.6 Flash)"**.
   - Click **"Generate Template Letter"** — the letter renders instantaneously without touching the API!
2. **Phase 2 (Gemini AI Generation)**:
   - Check **"Use AI (Gemini 3.6 Flash)"**.
   - Click **"Generate with Gemini AI"** — view the "Generating..." loading animation and review the tailored cover letter.
3. **Resume Integration**:
   - Drag and drop or browse any `.pdf` resume file.
   - Observe real-time PDF text extraction.
   - Click **"Generate with Gemini AI"** to see achievements from your resume woven seamlessly into the letter.
4. **Copy to Clipboard**:
   - Click **"Copy to Clipboard"** in the top right of the output card to copy the full letter text with immediate visual confirmation.

---

## 📄 License

MIT License. Free to use and customize for your own job applications!
