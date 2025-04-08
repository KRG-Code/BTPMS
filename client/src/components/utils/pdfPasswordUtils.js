import { PDFDocument } from 'pdf-lib';

/**
 * Encrypts a PDF blob with a password
 * 
 * @param {Blob} pdfBlob - The original PDF blob
 * @param {string} password - The password to encrypt with
 * @returns {Promise<Blob>} - A new blob containing the encrypted PDF
 */
export const encryptPDF = async (pdfBlob, password) => {
  try {
    // Convert blob to arrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Encrypt with password
    const encryptedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      // Apply encryption
      userPassword: password,
      ownerPassword: password,
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: false,
        documentAssembly: false,
      },
    });
    
    // Create a new blob with the encrypted PDF
    return new Blob([encryptedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error encrypting PDF:', error);
    throw error;
  }
};

/**
 * Creates and downloads a password-protected PDF
 * 
 * @param {Component} PdfDocument - React-PDF document component
 * @param {Object} documentProps - Props to pass to PDF document
 * @param {string} password - The password to encrypt with
 * @param {string} fileName - The filename without extension
 */
export const createAndDownloadProtectedPDF = async (PdfDocument, documentProps, password, fileName) => {
  try {
    // Generate the PDF blob first
    const pdfBlob = await pdf(
      <PdfDocument {...documentProps} />
    ).toBlob();
    
    // Encrypt the PDF
    const encryptedPdfBlob = await encryptPDF(pdfBlob, password);
    
    // Create a download link
    const url = URL.createObjectURL(encryptedPdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error creating protected PDF:', error);
    return false;
  }
};
