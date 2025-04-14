// Content script for LinkedIn job descriptions
console.log("AI Resume Tailor content script loaded");

// Initialize immediately
initialize();

// Initialize function
function initialize() {
  console.log('AI Resume Tailor content script initialized');
  
  // Get current page info
  const currentUrl = window.location.href;
  const hostname = window.location.hostname;
  
  console.log('Current URL:', currentUrl);
  console.log('Hostname:', hostname);
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    if (message.action === 'extractJobDescription') {
      const result = extractLinkedInJobDescription();
      sendResponse(result);
    } else if (message.action === 'getPageInfo') {
      sendResponse({
        url: currentUrl,
        hostname: hostname
      });
    }
    
    return true; // Keep the message channel open for async response
  });
}

// Extract job description specifically for LinkedIn job pages
function extractLinkedInJobDescription() {
  console.log('Extracting LinkedIn job description');
  
  try {
    const currentUrl = window.location.href;
    
    // Check if we're on a LinkedIn job page
    if (!currentUrl.includes('linkedin.com') || 
        (!currentUrl.includes('/jobs/') && !currentUrl.includes('currentJobId='))) {
      console.error('Not on a LinkedIn job page');
      return { 
        success: false, 
        error: 'Not on a LinkedIn job page' 
      };
    }
    
    console.log('LinkedIn job page detected');
    
    // Try multiple selectors for job description - most specific to most general
    const descriptionSelectors = [
      '.jobs-description-content__text',
      '.jobs-description__content',
      '.jobs-description',
      '.jobs-details-job-description',
      '#job-details',
      '[data-testid="job-details"]',
      'div[class*="jobs-description"]'
    ];
    
    // Try to find job description element
    let descriptionElement = null;
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 100) {
        console.log(`Found job description using selector: ${selector}`);
        descriptionElement = element;
        break;
      }
    }
    
    // If no element found by selectors, try finding the largest text block
    if (!descriptionElement) {
      console.log('No job description found using selectors, trying largest text block');
      
      // Try to find the job details section first
      const possibleContainers = [
        document.querySelector('div[class*="jobs-details"]'),
        document.querySelector('div[class*="job-view-layout"]'),
        document.querySelector('main'),
        document.body
      ];
      
      let container = null;
      for (const possible of possibleContainers) {
        if (possible) {
          container = possible;
          console.log('Using container:', possible.tagName, possible.className || 'no-class');
          break;
        }
      }
      
      if (container) {
        // Find the largest text block in the container
        const textElements = container.querySelectorAll('div, section, p');
        let largestElement = null;
        let largestTextLength = 0;
        
        textElements.forEach(el => {
          const textLength = el.textContent ? el.textContent.trim().length : 0;
          if (textLength > 200 && textLength > largestTextLength) {
            largestElement = el;
            largestTextLength = textLength;
          }
        });
        
        if (largestElement) {
          console.log('Found largest text element:', 
                     largestElement.tagName, 
                     largestElement.className || 'no-class', 
                     'Text length:', largestTextLength);
          descriptionElement = largestElement;
        }
      }
    }
    
    // Try to find job title
    const titleSelectors = [
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card__job-title',
      'h1[class*="job-title"]',
      'h1'
    ];
    
    let jobTitle = 'Unknown Position';
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 0) {
        jobTitle = element.textContent.trim();
        console.log(`Found job title using selector: ${selector}`);
        break;
      }
    }
    
    // Try to find company name
    const companySelectors = [
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__company-name',
      '[class*="company-name"]',
      '[data-test-job-publisher-name]'
    ];
    
    let company = 'Unknown Company';
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 0) {
        company = element.textContent.trim();
        console.log(`Found company using selector: ${selector}`);
        break;
      }
    }
    
    // If we found a description element, clean and return the content
    if (descriptionElement) {
      const jobDescription = cleanText(descriptionElement.textContent);
      console.log('Job description extracted, length:', jobDescription.length);
      
      // Log a sample of what we found
      console.log('Job description sample:', jobDescription.substring(0, 100) + '...');
      
      return {
        success: true,
        jobDescription: jobDescription,
        jobTitle: jobTitle,
        company: company
      };
    }
    
    // Last resort - try to get job description directly from DOM structure
    console.log('Attempting direct DOM structure analysis');
    
    // For LinkedIn jobs collection pages, try finding the right pane
    const rightPanes = document.querySelectorAll('.jobs-search__right-pane, .jobs-details__main-content');
    if (rightPanes.length > 0) {
      const pane = rightPanes[0];
      const jobDescription = cleanText(pane.textContent);
      
      if (jobDescription.length > 200) {
        console.log('Found job description in right pane, length:', jobDescription.length);
        return {
          success: true,
          jobDescription: jobDescription,
          jobTitle: jobTitle,
          company: company
        };
      }
    }
    
    console.error('No suitable job description found');
    return { 
      success: false, 
      error: 'No job description found' 
    };
  } catch (error) {
    console.error('Error extracting job description:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Clean up text
function cleanText(text) {
  if (!text) return '';
  
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, ' ');
  
  // Remove common noise text
  const noisePatterns = [
    /Apply Now/gi,
    /Save Job/gi,
    /Share Job/gi,
    /Report Job/gi,
    /More actions/gi,
    /Show more/gi,
    /Show less/gi,
    /About the job/gi
  ];
  
  noisePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned.trim();
} 