# Resume Tailor Backend Server

This is the backend server for the AI Resume Tailor Chrome extension, handling PDF parsing and text extraction to avoid browser environment limitations.

## Setup

1. Install dependencies:
   ```
   cd server
   npm install
   ```

2. Configure environment variables:
   - Copy the `.env.example` file to `.env`
   - Update the values in `.env` with your API keys and secrets

3. Start the server:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns the server status

### Parse PDF
- **POST** `/api/parse-pdf`
- Accepts either:
  - Multipart form with a file upload (field name: `file`)
  - JSON body with `pdfData` as an array of bytes
- Returns extracted text and structured data

### Parse Resume Text
- **POST** `/api/parse-resume-text`
- Accepts a JSON body with `resumeText` field
- Returns structured resume data

## Security

In production, make sure to:
1. Use HTTPS
2. Implement proper authentication
3. Add rate limiting
4. Keep your API keys secure 