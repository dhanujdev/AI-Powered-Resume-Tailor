# AI-Powered Resume Tailor

A sophisticated Chrome extension utilizing advanced AI technologies to revolutionize your job search process through intelligent job scraping, resume customization, and application form automation.

## 🚀 Key Features

- **AI-Driven Job Analysis**: Employs LangChain and LlamaIndex to semantically analyze job descriptions and extract key requirements
- **Intelligent Resume Tailoring**: Uses OpenAI's large language models to customize your resume for specific job postings
- **Automated Form Completion**: Leverages DOM manipulation and AI to automatically fill application forms
- **Visual DOM Mapper**: Interactive tool for configuring scraping selectors through visual selection

## 🧠 AI/ML Technology Stack

- **LangChain**: For composable AI workflows and document processing
- **LlamaIndex**: For semantic indexing and retrieval of job information
- **OpenAI Integration**: Leveraging powerful language models for content generation
- **Multi-Agent Architecture**: Specialized AI agents handling different aspects of the workflow

## 💻 Technical Implementation

- **Chrome Extension Framework**: Content scripts, background workers, and popup interface
- **Modern JavaScript**: ES6+ features with webpack bundling
- **Secure API Integration**: Protected access to OpenAI API
- **Local Data Storage**: Privacy-focused design with client-side data handling
- **Comprehensive Testing**: Unit, E2E, and performance tests with Jest and Puppeteer

## 🔒 Security & Privacy

- **Client-Side Processing**: All personal data remains on your device
- **API Key Protection**: Secure storage of API credentials
- **GDPR Compliance**: Tools for data export and deletion
- **Minimal Required Permissions**: Restricted to essential functionality

## 📊 Use Cases

- **Technical Professionals**: Customize resumes for specialized technical roles
- **Career Transitioners**: Highlight transferable skills relevant to new positions
- **Job Market Analysis**: Gain insights on in-demand skills and qualifications
- **Application Process Optimization**: Reduce time spent on repetitive application forms

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Chrome browser

### Development Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-powered-resume-tailor.git
cd ai-powered-resume-tailor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file for your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Build the extension in development mode:
```bash
npm run dev
```

### Loading the Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle switch in the top-right corner)
3. Click "Load unpacked" and select the `dist` folder from the project
4. The extension should now appear in your extensions list and toolbar

## 📝 Usage Guide

### Initial Setup
1. Click the extension icon in the toolbar
2. Navigate to the "Settings" tab
3. Enter your OpenAI API key and save
4. Upload your base resume in the "Upload Resume" tab

### Using with Job Sites
1. Browse to a job listing on LinkedIn, Indeed, or Glassdoor
2. The extension will automatically detect job descriptions
3. Click the extension icon to open the popup
4. Verify the job description was correctly extracted
5. Click "Tailor My Resume" to customize your resume for the job
6. Download the tailored resume for use in your application

### Customization Options
- Toggle automatic job description extraction in Settings
- Adjust the resume tailoring strategy for different job types
- Enable/disable history tracking for previous tailoring attempts

## 🤝 Contributing

Contributions are welcome! Please check out our [Contribution Guidelines](CONTRIBUTING.md) for details on how to get started.

## 📄 License

MIT

---

This project showcases implementation of modern AI techniques and frameworks to create practical solutions for real-world challenges in job search and application processes.