import axios from 'axios';
import { toast } from 'react-toastify';
import { pdf } from '@react-pdf/renderer';

/**
 * Creates and downloads a password-protected ZIP file containing the report as PDF
 * @param {Component} ReportComponent - React component to render in the PDF
 * @param {Object} reportData - Data to pass to the report component
 * @param {string} password - Password to protect the ZIP file
 * @param {string} fileName - Name for the downloaded file
 * @returns {boolean} - True if download succeeded
 */
export const createAndDownloadProtectedZip = async (ReportComponent, reportData, password, fileName) => {
  try {
    // Directly render the React component to a PDF blob
    const reportDocument = <ReportComponent {...reportData} />;
    const pdfBlob = await pdf(reportDocument).toBlob();
    
    // Convert PDF blob to base64 string for API transmission
    const pdfBase64 = await blobToBase64(pdfBlob);
    
    // Process and download the report
    return await processAndDownloadReport(pdfBase64, password, fileName);
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    
    // Only show error toast for the final error
    toast.error('Failed to generate report. Please try again later.');
    return false;
  }
};

// Helper function to process and download the report
const processAndDownloadReport = async (pdfBase64, password, fileName) => {
  try {
    // Send to server to create encrypted ZIP with PDF
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/zip/create-encrypted`,
      {
        password,
        fileContent: pdfBase64,
        fileName: fileName || 'report',
        fileType: 'pdf'
      },
      {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000,
        maxContentLength: 100 * 1024 * 1024
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName || 'report'}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Return true but DON'T show success toast here
    // Let the calling component show the success message
    return true;
  } catch (error) {
    console.error('Error in report processing:', error);
    
    // Show error toast only for actual errors
    toast.error('Failed to download report. Please try again later.');
    
    return false;
  }
};

// Helper function to convert Blob to base64 string
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to simplify report data to make it smaller
const simplifyReportData = (data) => {
  // This function would reduce the amount of data in the report
  // For example, limiting the number of entries, removing unnecessary fields, etc.
  
  let simplified = { ...data };
  
  // If there are incidents, limit them to 50
  if (simplified.incidents && simplified.incidents.length > 50) {
    simplified.incidents = simplified.incidents.slice(0, 50);
    simplified.limitedIncidents = true;
    simplified.totalIncidents = data.incidents.length;
  }
  
  // If there are false alarms, limit them to 50
  if (simplified.falseAlarms && simplified.falseAlarms.length > 50) {
    simplified.falseAlarms = simplified.falseAlarms.slice(0, 50);
    simplified.limitedFalseAlarms = true;
    simplified.totalFalseAlarms = data.falseAlarms.length;
  }
  
  // Add a note about the simplification
  simplified.isSimplified = true;
  
  return simplified;
};
