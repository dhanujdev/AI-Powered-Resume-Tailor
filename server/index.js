const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Parse PDF endpoint
app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
  try {
    // Check if we have a file upload
    if (req.file) {
      console.log('Processing uploaded file:', req.file.originalname);
      const pdfBuffer = req.file.buffer;
      const result = await parsePDF(pdfBuffer);
      return res.json(result);
    }
    
    // Check if we have PDF data in the request body
    if (req.body.pdfData && Array.isArray(req.body.pdfData)) {
      console.log('Processing PDF data from request body');
      const pdfBuffer = Buffer.from(req.body.pdfData);
      const result = await parsePDF(pdfBuffer);
      return res.json(result);
    }
    
    return res.status(400).json({ 
      success: false, 
      error: 'No PDF file or data provided' 
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to parse PDF' 
    });
  }
});

// Parse resume text endpoint
app.post('/api/parse-resume-text', async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText || typeof resumeText !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid resume text provided' 
      });
    }
    
    console.log('Processing resume text');
    
    // In a real implementation, you would call the OpenAI API here
    // For now, we'll return a mock structured response
    const structuredData = mockParseResumeWithLLM(resumeText);
    
    return res.json({
      success: true,
      structuredData
    });
  } catch (error) {
    console.error('Error parsing resume text:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to parse resume text' 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/**
 * Parse PDF file and extract text
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Object} - Parsed result
 */
async function parsePDF(pdfBuffer) {
  try {
    // Use pdf-parse to extract text from the PDF
    const data = await pdfParse(pdfBuffer);
    const text = data.text || '';
    
    console.log(`PDF parsed successfully. Number of pages: ${data.numpages}`);
    
    if (text.trim().length < 50) {
      console.warn('Extracted text is very short, PDF might be image-based or have security restrictions');
      return {
        success: true,
        text: "PDF text extraction was limited. For better results, please copy and paste the resume text manually.",
        structuredData: null,
        info: {
          pages: data.numpages,
          metadata: { }
        }
      };
    }
    
    // In a real implementation, you would call the OpenAI API here
    // For now, we'll return a mock structured response
    const structuredData = mockParseResumeWithLLM(text);
    
    return {
      success: true,
      text: text.trim(),
      structuredData,
      info: {
        pages: data.numpages,
        metadata: { }
      }
    };
  } catch (error) {
    console.error('Error in PDF parsing:', error);
    throw new Error('PDF parsing error: ' + error.message);
  }
}

/**
 * Mock function for resume parsing with LLM
 * In production, this would call the OpenAI API
 * @param {string} resumeText 
 * @returns {Object} Structured resume data
 */
function mockParseResumeWithLLM(resumeText) {
  // This is a very simplified mock function
  // In a real implementation, this would call the OpenAI API
  
  // Extract name (simple regex to find capitalized names)
  const nameMatch = resumeText.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)+)/m);
  const name = nameMatch ? nameMatch[0] : 'Unknown Name';
  
  // Extract email
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract phone number (simple pattern)
  const phoneMatch = resumeText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';
  
  // Extract skills (keywords)
  const skills = [];
  const skillKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'AWS'];
  skillKeywords.forEach(skill => {
    if (resumeText.match(new RegExp(skill, 'i'))) {
      skills.push(skill);
    }
  });
  
  return {
    name,
    email,
    phone,
    location: 'Unknown Location',
    summary: 'Professional with various skills and experience.',
    skills,
    experience: [
      {
        title: 'Software Developer',
        company: 'Example Company',
        date: '2020 - Present',
        description: 'Worked on various projects.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        school: 'Example University',
        date: '2016 - 2020',
        gpa: '3.8'
      }
    ]
  };
} 