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

## 🛠️ Development

Complete instructions for local development and contributing to the project.

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Development build with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm test
```

## 📝 License

MIT

---

This project showcases implementation of modern AI techniques and frameworks to create practical solutions for real-world challenges in job search and application processes.