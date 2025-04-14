# AI-Powered Resume Tailor - Project Documentation

## Project Overview
AI-Powered Resume Tailor is a Chrome extension that uses AI technologies to help job seekers customize their resumes for specific job descriptions. The extension automatically extracts job descriptions from popular job posting websites, analyzes requirements, and suggests tailored resume content to match the job.

## Project Structure

### Core Components
```
AI-Powered-Resume-Tailor/
├── src/                    # Frontend extension source code
│   ├── background/         # Background scripts for the extension
│   ├── components/         # React UI components
│   ├── content/            # Content scripts for web page interaction
│   ├── services/           # AI services for text analysis
│   ├── styles/             # CSS styles
│   ├── utils/              # Utility functions
│   └── popup.js            # Main popup UI script
├── server/                 # Backend server
│   ├── index.js            # Express server implementation
├── public/                 # Static assets
│   ├── manifest.json       # Chrome extension manifest
│   └── popup.html          # HTML for extension popup
├── dist/                   # Compiled extension files (generated)
└── webpack.config.js       # Webpack build configuration
```

### Key Files
- **src/popup.js**: Main UI controller for the extension popup
- **server/index.js**: Express server that handles PDF parsing and communicates with AI services
- **public/manifest.json**: Chrome extension configuration
- **webpack.config.js**: Build configuration

## Features

### 1. Job Description Extraction
The extension automatically extracts job descriptions from job posting websites through content scripts that analyze the DOM structure of the page.

### 2. Resume Parsing
Users can upload their resume (PDF or text) which is parsed to extract structured information about their skills, experience, and qualifications.

### 3. AI-Powered Resume Tailoring
The application uses AI services to analyze job requirements and suggest tailored content for the user's resume to better match the job description.

### 4. Resume Storage
Resumes are stored locally in the Chrome extension's storage for privacy and quick access.

### 5. History Tracking
The extension keeps track of previously tailored resumes for different job applications.

## Technical Implementation

### Frontend (Chrome Extension)
- Built with JavaScript (ES6+)
- Uses React for UI components
- Communicates with the content page via Chrome messaging API
- Stores data in Chrome's local storage
- Bundled with Webpack

### Backend (Express Server)
- Node.js with Express
- PDF parsing with pdf-parse
- Structured as a REST API with endpoints for:
  - PDF parsing
  - Resume text analysis
  - Health check

### AI Implementation
The project uses several AI services (mocked in the current implementation):
- **JobRequirementExtractor**: Extracts key skills and requirements from job descriptions
- **ResumeSkillMatcher**: Matches user skills to job requirements
- **ContentGenerator**: Generates tailored resume content
- **QualityEvaluator**: Evaluates the quality of the tailored resume

In a production implementation, these would be powered by:
- LangChain for AI workflow composition
- LlamaIndex for semantic indexing
- OpenAI API for natural language processing

## Setup and Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Chrome browser

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with OpenAI API key
4. Build the extension: `npm run dev`
5. Load the extension in Chrome from the `dist` folder

### Server Setup
1. Navigate to the server directory: `cd server`
2. Install server dependencies: `npm install`
3. Start the server: `npm start`

## Future Improvements
1. Implement full integration with OpenAI API
2. Add support for more file formats
3. Improve job requirement extraction accuracy
4. Add user authentication for cloud storage
5. Expand to support more job sites

## Maintenance Notes
- API keys are stored in environment variables for security
- PDF parsing is limited to text-based PDFs
- The extension is designed to work with common job posting sites but may require updates for site layout changes 