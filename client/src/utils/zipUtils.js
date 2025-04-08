import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import React from 'react';

/**
 * Creates a password-protected ZIP file containing a PDF and downloads it
 * 
 * @param {Component} PdfDocument - React-PDF document component
 * @param {Object} documentProps - Props to pass to the PDF document
 * @param {string} password - Password for ZIP encryption
 * @param {string} fileName - Base filename (without extension)
 */
export const createAndDownloadProtectedZip = async (PdfDocument, documentProps, password, fileName) => {
  try {
    console.log('Creating password-protected ZIP...');
    
    // Generate the PDF blob first
    const pdfBlob = await pdf(
      <PdfDocument {...documentProps} />
    ).toBlob();
    
    // Create a zip file
    const zip = new JSZip();
    
    // Add the PDF to the zip
    zip.file(`${fileName}.pdf`, pdfBlob);
    
    // Generate the zip with password protection
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9 // Maximum compression
      },
      password: password, // Apply password protection to the ZIP
      encryptStrength: 3 // Use AES-256 encryption (strongest)
    });
    
    console.log('Password-protected ZIP created, initiating download...');
    
    // Use a more direct approach to download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.zip`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    return false;
  }
};
