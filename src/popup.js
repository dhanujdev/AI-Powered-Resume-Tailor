import './styles/popup.css';

// Tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
  // Initialize tabs
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show active tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });
  
  // Initialize job extraction button
  const extractJobBtn = document.getElementById('extract-job-btn');
  extractJobBtn.addEventListener('click', extractJobDescription);
  
  // Initialize resume upload functionality
  const resumeFileInput = document.getElementById('resume-file');
  resumeFileInput.addEventListener('change', handleResumeFileUpload);
  
  const saveResumeBtn = document.getElementById('save-resume-btn');
  saveResumeBtn.addEventListener('click', saveResumeText);
  
  // Initialize API key saving
  const saveApiKeyBtn = document.getElementById('save-api-key-btn');
  saveApiKeyBtn.addEventListener('click', saveApiKey);
  
  // Initialize tailoring functionality
  const tailorBtn = document.getElementById('tailor-btn');
  tailorBtn.addEventListener('click', tailorResume);
  
  // Load existing data
  loadSavedData();

  // Debug button
  const debugButton = document.getElementById('debugButton'); 
  if (debugButton) {
    debugButton.addEventListener('click', debugCurrentTab);
  }
});

// Function to extract job description from the current page
async function extractJobDescription() {
  const jobStatus = document.getElementById('job-status');
  const jobPreview = document.getElementById('job-description-preview');
  
  jobStatus.textContent = 'Extracting job description...';
  
  // Query the active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  
  // Send a message to the content script to extract the job description
  try {
    const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'extractJobDescription' });
    
    if (response && response.success) {
      jobStatus.textContent = 'Job description extracted successfully';
      jobPreview.textContent = truncateText(response.jobDescription, 150);
      
      // Save the job description to storage
      await chrome.storage.local.set({ 
        currentJobDescription: response.jobDescription,
        currentJobTitle: response.jobTitle || 'Unknown Position',
        currentJobCompany: response.company || 'Unknown Company'
      });
      
      // Enable the tailor button if resume is available
      updateTailorButtonState();
    } else {
      jobStatus.textContent = 'Failed to extract job description';
    }
  } catch (error) {
    console.error('Error extracting job description:', error);
    jobStatus.textContent = 'Error: Content script not responding. Reload the page and try again.';
  }
}

// Handle resume file upload
async function handleResumeFileUpload(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;

    // Track upload starting
    resumeUploadStatus.textContent = 'Processing...';
    resumeUploadStatus.classList.add('processing');
    resumeUploadStatus.classList.remove('success', 'error');
    
    // Show loading animation
    const loader = document.createElement('div');
    loader.className = 'loader';
    resumeUploadStatus.appendChild(loader);
    
    let resumeText = '';
    let structuredData = null;
    
    if (file.type === 'application/pdf') {
      // Handle PDF file
      const arrayBuffer = await file.arrayBuffer();
      
      // Send to background script for processing
      const result = await chrome.runtime.sendMessage({
        action: 'parsePDF',
        data: { pdfBuffer: arrayBuffer }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to parse PDF');
      }
      
      resumeText = result.text;
      structuredData = result.structuredData;
      
    } else {
      // Handle text file
      resumeText = await file.text();
      
      try {
        // Try to parse from background script using OpenAI
        const result = await chrome.runtime.sendMessage({
          action: 'parseResumeText',
          data: { resumeText }
        });
        
        if (result.success) {
          structuredData = result.structuredData;
        }
      } catch (parseError) {
        console.warn('Failed to parse resume structure:', parseError);
        // Continue with just the text version
      }
    }
    
    // Save resume text to storage
    await chrome.storage.local.set({ resumeText });
    
    // If we have structured data, save that too
    if (structuredData) {
      await chrome.storage.local.set({ resumeStructured: structuredData });
      displayStructuredResume(structuredData);
    } else {
      // If no structured data, hide the structured view
      document.getElementById('structured-resume-view').style.display = 'none';
    }
    
    // Update textarea
    resumeTextArea.value = resumeText;
    
    // Update file name display
    document.getElementById('resume-file-name').textContent = file.name;
    
    // Update status
    resumeUploadStatus.textContent = 'Resume uploaded successfully!';
    resumeUploadStatus.classList.add('success');
    resumeUploadStatus.classList.remove('processing', 'error');
    
    // Update tailor button state
    updateTailorButtonState();
    
  } catch (error) {
    console.error('Error in handleResumeFileUpload:', error);
    
    // Update status with error message
    resumeUploadStatus.textContent = `Error: ${error.message}`;
    resumeUploadStatus.classList.add('error');
    resumeUploadStatus.classList.remove('processing', 'success');
  }
}

// Function to display structured resume data
function displayStructuredResume(data) {
  const container = document.getElementById('structured-resume-view');
  container.innerHTML = ''; // Clear existing content
  container.style.display = 'block';
  
  // Create a title
  const title = document.createElement('h3');
  title.textContent = 'Resume Structure';
  container.appendChild(title);
  
  // Create a toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Toggle View';
  toggleBtn.className = 'toggle-btn';
  toggleBtn.onclick = () => {
    const content = document.getElementById('structured-content');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
  };
  container.appendChild(toggleBtn);
  
  // Create content container
  const content = document.createElement('div');
  content.id = 'structured-content';
  
  // Add basic info
  if (data.name) {
    const nameEl = document.createElement('h4');
    nameEl.textContent = data.name;
    content.appendChild(nameEl);
  }
  
  const contactInfo = document.createElement('div');
  contactInfo.className = 'contact-info';
  
  if (data.email) {
    const emailEl = document.createElement('p');
    emailEl.innerHTML = `<strong>Email:</strong> ${data.email}`;
    contactInfo.appendChild(emailEl);
  }
  
  if (data.phone) {
    const phoneEl = document.createElement('p');
    phoneEl.innerHTML = `<strong>Phone:</strong> ${data.phone}`;
    contactInfo.appendChild(phoneEl);
  }
  
  if (data.location) {
    const locationEl = document.createElement('p');
    locationEl.innerHTML = `<strong>Location:</strong> ${data.location}`;
    contactInfo.appendChild(locationEl);
  }
  
  content.appendChild(contactInfo);
  
  // Add summary if exists
  if (data.summary) {
    const summarySection = document.createElement('div');
    summarySection.className = 'resume-section';
    
    const summaryTitle = document.createElement('h5');
    summaryTitle.textContent = 'Summary';
    summarySection.appendChild(summaryTitle);
    
    const summaryContent = document.createElement('p');
    summaryContent.textContent = data.summary;
    summarySection.appendChild(summaryContent);
    
    content.appendChild(summarySection);
  }
  
  // Add skills if exists
  if (data.skills && data.skills.length > 0) {
    const skillsSection = document.createElement('div');
    skillsSection.className = 'resume-section';
    
    const skillsTitle = document.createElement('h5');
    skillsTitle.textContent = 'Skills';
    skillsSection.appendChild(skillsTitle);
    
    const skillsList = document.createElement('ul');
    skillsList.className = 'skills-list';
    
    data.skills.forEach(skill => {
      const skillItem = document.createElement('li');
      skillItem.textContent = skill;
      skillsList.appendChild(skillItem);
    });
    
    skillsSection.appendChild(skillsList);
    content.appendChild(skillsSection);
  }
  
  // Add experience if exists
  if (data.experience && data.experience.length > 0) {
    const expSection = document.createElement('div');
    expSection.className = 'resume-section';
    
    const expTitle = document.createElement('h5');
    expTitle.textContent = 'Experience';
    expSection.appendChild(expTitle);
    
    data.experience.forEach(exp => {
      const expItem = document.createElement('div');
      expItem.className = 'exp-item';
      
      const expHeader = document.createElement('div');
      expHeader.className = 'exp-header';
      
      if (exp.title) {
        const titleEl = document.createElement('strong');
        titleEl.textContent = exp.title;
        expHeader.appendChild(titleEl);
      }
      
      if (exp.company) {
        const companyEl = document.createElement('span');
        companyEl.textContent = exp.company;
        expHeader.appendChild(document.createTextNode(' at '));
        expHeader.appendChild(companyEl);
      }
      
      if (exp.date) {
        const dateEl = document.createElement('span');
        dateEl.className = 'exp-date';
        dateEl.textContent = exp.date;
        expHeader.appendChild(document.createTextNode(' • '));
        expHeader.appendChild(dateEl);
      }
      
      expItem.appendChild(expHeader);
      
      if (exp.description) {
        const descEl = document.createElement('p');
        descEl.textContent = exp.description;
        expItem.appendChild(descEl);
      }
      
      expSection.appendChild(expItem);
    });
    
    content.appendChild(expSection);
  }
  
  // Add education if exists
  if (data.education && data.education.length > 0) {
    const eduSection = document.createElement('div');
    eduSection.className = 'resume-section';
    
    const eduTitle = document.createElement('h5');
    eduTitle.textContent = 'Education';
    eduSection.appendChild(eduTitle);
    
    data.education.forEach(edu => {
      const eduItem = document.createElement('div');
      eduItem.className = 'edu-item';
      
      if (edu.degree) {
        const degreeEl = document.createElement('strong');
        degreeEl.textContent = edu.degree;
        eduItem.appendChild(degreeEl);
      }
      
      if (edu.school) {
        const schoolEl = document.createElement('span');
        schoolEl.textContent = edu.school;
        eduItem.appendChild(document.createTextNode(' - '));
        eduItem.appendChild(schoolEl);
      }
      
      if (edu.date) {
        const dateEl = document.createElement('span');
        dateEl.className = 'edu-date';
        dateEl.textContent = edu.date;
        eduItem.appendChild(document.createTextNode(' • '));
        eduItem.appendChild(dateEl);
      }
      
      if (edu.gpa) {
        const gpaEl = document.createElement('div');
        gpaEl.className = 'edu-gpa';
        gpaEl.textContent = `GPA: ${edu.gpa}`;
        eduItem.appendChild(gpaEl);
      }
      
      eduSection.appendChild(eduItem);
    });
    
    content.appendChild(eduSection);
  }
  
  container.appendChild(content);
}

// Save manually entered resume text
async function saveResumeText() {
  const resumeText = document.getElementById('resume-text').value;
  const uploadStatus = document.getElementById('upload-status');
  
  if (!resumeText.trim()) {
    uploadStatus.textContent = 'Please enter resume text';
    return;
  }
  
  // Store the resume content
  await chrome.storage.local.set({ 
    resumeContent: resumeText,
    resumeFileName: 'Manual Entry'
  });
  
  uploadStatus.textContent = 'Resume saved successfully';
  document.getElementById('resume-text').value = '';
  loadSavedData();
}

// Save API key
async function saveApiKey() {
  const apiKey = document.getElementById('api-key').value;
  const apiKeyStatus = document.getElementById('api-key-status');
  
  if (!apiKey.trim()) {
    apiKeyStatus.textContent = 'Please enter an API key';
    return;
  }
  
  // Validate API key format
  if (!apiKey.startsWith('sk-')) {
    apiKeyStatus.textContent = 'Invalid API key format. Should start with "sk-"';
    return;
  }
  
  // Store the API key securely
  await chrome.storage.local.set({ apiKey });
  
  apiKeyStatus.textContent = 'API key saved successfully';
  
  // For security, clear the input field after saving
  setTimeout(() => {
    document.getElementById('api-key').value = '';
    apiKeyStatus.textContent = '';
  }, 3000);
}

// Tailor the resume to the job description
async function tailorResume() {
  const tailorStatus = document.getElementById('tailor-status');
  tailorStatus.textContent = 'Tailoring resume...';
  
  // Get saved data
  const { resumeContent, currentJobDescription, apiKey } = await chrome.storage.local.get([
    'resumeContent', 
    'currentJobDescription',
    'apiKey'
  ]);
  
  if (!apiKey) {
    tailorStatus.textContent = 'Error: API key not found. Please add in Settings tab';
    return;
  }
  
  if (!resumeContent || !currentJobDescription) {
    tailorStatus.textContent = 'Error: Missing resume or job description';
    return;
  }
  
  // In a real implementation, this would call your background script to use AI services
  chrome.runtime.sendMessage({
    action: 'tailorResume',
    data: {
      resume: resumeContent,
      jobDescription: currentJobDescription
    }
  }, (response) => {
    if (response && response.success) {
      tailorStatus.textContent = 'Resume tailored successfully! Download ready.';
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = `data:text/plain;charset=utf-8,${encodeURIComponent(response.tailoredResume)}`;
      downloadLink.download = 'Tailored_Resume.txt';
      downloadLink.textContent = 'Download Tailored Resume';
      downloadLink.style.display = 'block';
      downloadLink.style.marginTop = '10px';
      
      // Append download link
      const tailorTab = document.getElementById('tailor-tab');
      tailorTab.appendChild(downloadLink);
      
      // Save to history
      saveToHistory(currentJobDescription, response.tailoredResume);
    } else {
      tailorStatus.textContent = 'Error tailoring resume: ' + (response?.error || 'Unknown error');
    }
  });
}

// Save tailoring to history
async function saveToHistory(jobDescription, tailoredResume) {
  // Check if history saving is enabled
  const { saveHistory } = await chrome.storage.local.get('saveHistory');
  
  if (saveHistory === false) return;
  
  // Get existing history
  const { tailoringHistory = [] } = await chrome.storage.local.get('tailoringHistory');
  
  // Add new entry
  tailoringHistory.unshift({
    date: new Date().toISOString(),
    jobDescription: truncateText(jobDescription, 100),
    tailoredResume
  });
  
  // Limit history to 10 entries
  const limitedHistory = tailoringHistory.slice(0, 10);
  
  // Save updated history
  await chrome.storage.local.set({ tailoringHistory: limitedHistory });
}

// Load saved data from storage
async function loadSavedData() {
  const { 
    resumeContent, 
    resumeFileName,
    resumeStructuredData,
    currentJobDescription,
    currentJobTitle,
    currentJobCompany,
    apiKey,
    autoExtract,
    saveHistory
  } = await chrome.storage.local.get([
    'resumeContent',
    'resumeFileName',
    'resumeStructuredData',
    'currentJobDescription',
    'currentJobTitle',
    'currentJobCompany',
    'apiKey',
    'autoExtract',
    'saveHistory'
  ]);
  
  // Update resume information
  const resumeStatus = document.getElementById('resume-status');
  const resumePreview = document.getElementById('resume-preview');
  
  if (resumeContent) {
    resumeStatus.textContent = `Resume loaded: ${resumeFileName || 'Resume'}`;
    
    // If we have structured data, display it nicely
    if (resumeStructuredData) {
      resumePreview.innerHTML = formatStructuredData(resumeStructuredData);
    } else {
      // Otherwise show the raw text
      resumePreview.textContent = truncateText(resumeContent, 150);
    }
    
    // Add download button for structured data if available
    if (resumeStructuredData) {
      addStructuredDataDownloadButton();
    }
  }
  
  // Update job description information
  const jobStatus = document.getElementById('job-status');
  const jobPreview = document.getElementById('job-description-preview');
  
  if (currentJobDescription) {
    const jobInfo = currentJobTitle ? `${currentJobTitle} at ${currentJobCompany}` : 'Job';
    jobStatus.textContent = `${jobInfo} description loaded`;
    jobPreview.textContent = truncateText(currentJobDescription, 150);
  }
  
  // Update settings
  if (typeof autoExtract === 'boolean') {
    document.getElementById('auto-extract').checked = autoExtract;
  }
  
  if (typeof saveHistory === 'boolean') {
    document.getElementById('save-history').checked = saveHistory;
  }
  
  // Update API key indicator (not showing the actual key)
  const apiKeyStatus = document.getElementById('api-key-status');
  if (apiKey) {
    apiKeyStatus.textContent = 'API key is set';
  }
  
  // Update tailor button state
  updateTailorButtonState();
}

// Update tailor button state based on available data
async function updateTailorButtonState() {
  const { resumeContent, currentJobDescription } = await chrome.storage.local.get([
    'resumeContent', 
    'currentJobDescription'
  ]);
  
  const tailorBtn = document.getElementById('tailor-btn');
  tailorBtn.disabled = !(resumeContent && currentJobDescription);
}

// Helper function to truncate text
function truncateText(text, maxLength) {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength) + '...';
}

// Debug utility function to get information about the current page
function debugCurrentTab() {
  const debugStatus = document.getElementById('debug-status');
  
  if (debugStatus) {
    debugStatus.textContent = 'Checking site detection...';
  }
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      if (debugStatus) {
        debugStatus.textContent = 'Error: Cannot access current tab';
      }
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error communicating with content script:', chrome.runtime.lastError);
        if (debugStatus) {
          debugStatus.textContent = `Error: Content script not running. Make sure you're on a supported job site.`;
        }
        return;
      }
      
      if (response) {
        console.log('Page info:', response);
        if (debugStatus) {
          debugStatus.textContent = `Site: ${response.siteConfig || 'Unknown'}\nURL: ${response.url}\nHostname: ${response.hostname}`;
        }
      }
    });
  });
}

// Format structured data for display
function formatStructuredData(data) {
  let html = '<div class="structured-data">';
  
  // Contact info
  html += '<div class="section"><h3>Contact Info</h3>';
  html += `<p><strong>Name:</strong> ${data.name || 'N/A'}</p>`;
  html += `<p><strong>Email:</strong> ${data.email || 'N/A'}</p>`;
  html += `<p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>`;
  html += `<p><strong>Location:</strong> ${data.location || 'N/A'}</p>`;
  html += '</div>';
  
  // Skills
  if (data.skills && data.skills.length > 0) {
    html += '<div class="section"><h3>Skills</h3><ul>';
    data.skills.forEach(skill => {
      html += `<li>${skill}</li>`;
    });
    html += '</ul></div>';
  }
  
  // Experience (just show the first one or two items for preview)
  if (data.experience && data.experience.length > 0) {
    html += '<div class="section"><h3>Experience</h3>';
    const previewExperience = data.experience.slice(0, 2);
    previewExperience.forEach(exp => {
      html += `<div class="item">`;
      html += `<p><strong>${exp.company || 'N/A'}</strong> | ${exp.title || 'N/A'}</p>`;
      html += `<p>${exp.date || 'N/A'}</p>`;
      html += `</div>`;
    });
    if (data.experience.length > 2) {
      html += '<p>...and more</p>';
    }
    html += '</div>';
  }
  
  // Education (just show the first item for preview)
  if (data.education && data.education.length > 0) {
    html += '<div class="section"><h3>Education</h3>';
    const edu = data.education[0];
    html += `<div class="item">`;
    html += `<p><strong>${edu.school || 'N/A'}</strong></p>`;
    html += `<p>${edu.degree || 'N/A'}</p>`;
    html += `<p>${edu.date || 'N/A'}</p>`;
    html += `</div>`;
    if (data.education.length > 1) {
      html += '<p>...and more</p>';
    }
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

// Add download button for structured data
function addStructuredDataDownloadButton() {
  chrome.storage.local.get('resumeStructuredData', function(result) {
    if (result.resumeStructuredData) {
      // Find a container to add the button
      const resumeStatusContainer = document.getElementById('resume-status').parentElement;
      
      // Remove any existing button
      const existingBtn = document.getElementById('download-structured-btn');
      if (existingBtn) {
        existingBtn.remove();
      }
      
      // Create download button
      const downloadBtn = document.createElement('button');
      downloadBtn.id = 'download-structured-btn';
      downloadBtn.textContent = 'Download Structured Data';
      downloadBtn.className = 'secondary-btn';
      downloadBtn.style.marginTop = '10px';
      downloadBtn.addEventListener('click', function() {
        const dataStr = JSON.stringify(result.resumeStructuredData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'structured_resume_data.json';
        link.click();
        
        URL.revokeObjectURL(url);
      });
      
      resumeStatusContainer.appendChild(downloadBtn);
    }
  });
} 