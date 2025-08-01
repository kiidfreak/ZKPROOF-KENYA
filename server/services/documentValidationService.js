const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class DocumentValidationService {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.worker = await Tesseract.createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      this.initialized = true;
      console.log('Document validation service initialized');
    } catch (error) {
      console.error('Failed to initialize document validation service:', error);
      this.initialized = false;
    }
  }

  async extractTextFromImage(imagePath) {
    if (!this.initialized) {
      throw new Error('Document validation service not initialized');
    }

    try {
      // Preprocess image for better OCR
      const processedImagePath = await this.preprocessImage(imagePath);
      
      // Extract text from image
      const { data: { text } } = await this.worker.recognize(processedImagePath);
      
      // Clean up processed image
      if (processedImagePath !== imagePath) {
        fs.unlinkSync(processedImagePath);
      }
      
      return this.cleanExtractedText(text);
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  async preprocessImage(imagePath) {
    try {
      const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.jpg');
      
      await sharp(imagePath)
        .resize(2000, null, { withoutEnlargement: true }) // Resize for better OCR
        .sharpen() // Sharpen edges
        .normalize() // Normalize contrast
        .threshold(128) // Convert to black and white
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imagePath; // Return original if preprocessing fails
    }
  }

  cleanExtractedText(text) {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-\.\/]/g, '') // Remove special characters except common ones
      .trim();
  }

  extractDocumentNumber(text, documentType) {
    const patterns = {
      passport: /(?:passport|passport\s*number|passport\s*no)[:\s]*([A-Z0-9]{6,12})/i,
      national_id: /(?:national\s*id|id\s*number|identity\s*number)[:\s]*([A-Z0-9]{6,15})/i,
      drivers_license: /(?:license|licence|driver\s*license|driver\s*licence)[:\s]*([A-Z0-9]{6,15})/i,
      other: /(?:number|no|id)[:\s]*([A-Z0-9]{6,15})/i
    };

    const pattern = patterns[documentType] || patterns.other;
    const match = text.match(pattern);
    
    if (match) {
      return match[1].replace(/\s/g, ''); // Remove spaces from matched number
    }

    // Fallback: look for any sequence of 6-15 alphanumeric characters
    const fallbackPattern = /([A-Z0-9]{6,15})/g;
    const matches = text.match(fallbackPattern);
    
    if (matches && matches.length > 0) {
      // Return the longest match as it's likely the document number
      return matches.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
    }

    return null;
  }

  extractDateOfBirth(text) {
    // Multiple date patterns
    const datePatterns = [
      /(?:date\s*of\s*birth|birth\s*date|dob)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
      /(?:born|birth)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.normalizeDate(match[1]);
      }
    }

    return null;
  }

  extractFullName(text) {
    // Look for name patterns
    const namePatterns = [
      /(?:name|full\s*name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  normalizeDate(dateString) {
    // Convert various date formats to YYYY-MM-DD
    const parts = dateString.split(/[\/\-\.]/);
    if (parts.length === 3) {
      let day, month, year;
      
      if (parts[2].length === 2) {
        // DD/MM/YY format
        year = parseInt(parts[2]) < 50 ? `20${parts[2]}` : `19${parts[2]}`;
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
      } else {
        // DD/MM/YYYY format
        year = parts[2];
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
      }
      
      return `${year}-${month}-${day}`;
    }
    
    return dateString;
  }

  async validateDocument(filePath, inputData) {
    try {
      // Extract text from document
      const extractedText = await this.extractTextFromImage(filePath);
      
      // Extract data from document
      const extractedData = {
        documentNumber: this.extractDocumentNumber(extractedText, inputData.documentType),
        dateOfBirth: this.extractDateOfBirth(extractedText),
        fullName: this.extractFullName(extractedText)
      };

      // Validate extracted data against input data
      const validationResults = {
        documentNumber: {
          extracted: extractedData.documentNumber,
          input: inputData.documentNumber,
          matches: extractedData.documentNumber === inputData.documentNumber,
          confidence: this.calculateConfidence(extractedData.documentNumber, inputData.documentNumber)
        },
        dateOfBirth: {
          extracted: extractedData.dateOfBirth,
          input: inputData.dateOfBirth,
          matches: extractedData.dateOfBirth === inputData.dateOfBirth,
          confidence: this.calculateConfidence(extractedData.dateOfBirth, inputData.dateOfBirth)
        },
        fullName: {
          extracted: extractedData.fullName,
          input: inputData.fullName,
          matches: extractedData.fullName === inputData.fullName,
          confidence: this.calculateConfidence(extractedData.fullName, inputData.fullName)
        }
      };

      // Calculate overall validation score
      const overallScore = this.calculateOverallScore(validationResults);
      
      return {
        isValid: overallScore >= 0.7, // 70% confidence threshold
        score: overallScore,
        extractedText: extractedText,
        extractedData: extractedData,
        validationResults: validationResults,
        errors: this.getValidationErrors(validationResults)
      };

    } catch (error) {
      console.error('Document validation failed:', error);
      return {
        isValid: false,
        score: 0,
        error: error.message,
        extractedText: '',
        extractedData: {},
        validationResults: {},
        errors: ['Document processing failed']
      };
    }
  }

  calculateConfidence(extracted, input) {
    if (!extracted || !input) return 0;
    
    const extractedLower = extracted.toLowerCase().replace(/\s/g, '');
    const inputLower = input.toLowerCase().replace(/\s/g, '');
    
    if (extractedLower === inputLower) return 1.0;
    
    // Calculate similarity using Levenshtein distance
    const distance = this.levenshteinDistance(extractedLower, inputLower);
    const maxLength = Math.max(extractedLower.length, inputLower.length);
    
    return Math.max(0, 1 - (distance / maxLength));
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  calculateOverallScore(validationResults) {
    const weights = {
      documentNumber: 0.5, // Most important
      dateOfBirth: 0.3,
      fullName: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [field, weight] of Object.entries(weights)) {
      if (validationResults[field]) {
        totalScore += validationResults[field].confidence * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  getValidationErrors(validationResults) {
    const errors = [];
    
    for (const [field, result] of Object.entries(validationResults)) {
      if (!result.matches && result.extracted) {
        errors.push(`${field} mismatch: extracted "${result.extracted}" but input was "${result.input}"`);
      } else if (!result.extracted) {
        errors.push(`Could not extract ${field} from document`);
      }
    }
    
    return errors;
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

module.exports = new DocumentValidationService(); 