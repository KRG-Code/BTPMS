const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const stream = require('stream');

// Track if we've already registered the format
let isFormatRegistered = false;

// Register format only once
function ensureFormatRegistered() {
  if (!isFormatRegistered) {
    try {
      // Register the zip-encrypted format with archiver
      archiver.registerFormat('zip-encrypted', require('archiver-zip-encrypted'));
      isFormatRegistered = true;
      console.log('ZIP encryption format registered successfully');
    } catch (error) {
      // If the error is about format already registered, just set our flag
      if (error.message.includes('format already registered')) {
        isFormatRegistered = true;
        console.log('ZIP encryption format was already registered');
      } else {
        // For other errors, log but don't throw to allow operation to continue
        console.error('Error registering ZIP format:', error.message);
      }
    }
  }
}

// Initialize the format registration when the module is loaded
ensureFormatRegistered();

exports.createEncryptedZip = async (req, res) => {
  try {
    console.log('Creating encrypted ZIP file - request received');
    
    // Extract and validate request body
    const { password, fileContent, fileName, fileType = 'pdf' } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    if (!fileContent) {
      return res.status(400).json({ message: 'File content is required' });
    }
    
    // Safe filename with no special characters
    const safeFileName = (fileName || 'report').replace(/[^a-z0-9]/gi, '_');
    
    // Create temporary directories if they don't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write base64 content to a temp file
    const fileExtension = fileType.toLowerCase();
    const filePath = path.join(tempDir, `${safeFileName}.${fileExtension}`);
    
    // Convert base64 to buffer and write to file
    try {
      const buffer = Buffer.from(fileContent, 'base64');
      fs.writeFileSync(filePath, buffer);
      console.log(`Created temporary ${fileExtension.toUpperCase()} file: ${filePath} (${buffer.length} bytes)`);
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return res.status(500).json({ 
        message: 'Error creating temporary file', 
        error: writeError.message 
      });
    }

    // Create a temp ZIP file
    const zipPath = path.join(tempDir, `${safeFileName}.zip`);
    const output = fs.createWriteStream(zipPath);
    
    // Create the archive with better error handling
    try {
      const archive = archiver.create('zip-encrypted', {
        zlib: { level: 9 },
        encryptionMethod: 'aes256',
        password
      });

      // Log errors
      archive.on('error', function(err) {
        console.error('Archive error:', err);
        // Don't respond here as we might have already sent headers
      });

      // Use pipe and promise for better stream handling
      archive.pipe(output);
      
      // Add the file to ZIP
      archive.file(filePath, { name: `${safeFileName}.${fileExtension}` });
      
      // Finalize the archive
      await archive.finalize();
      
      // Wait for output stream to finish
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });
      
      console.log(`ZIP file created successfully at ${zipPath}`);
    } catch (archiveError) {
      console.error('Error creating archive:', archiveError);
      return res.status(500).json({ 
        message: 'Error creating ZIP archive', 
        error: archiveError.message 
      });
    }
    
    // Stream the file to the client instead of loading it all into memory
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}.zip"`);
    
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
    
    // Clean up the files after streaming is complete
    fileStream.on('end', () => {
      try {
        fs.unlinkSync(filePath);
        fs.unlinkSync(zipPath);
        console.log('Temp files cleaned up');
      } catch (cleanupErr) {
        console.error('Error cleaning up temp files:', cleanupErr);
      }
    });
    
    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      // Can't send error response here as headers might already be sent
    });
  } catch (error) {
    console.error('Error creating encrypted ZIP:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error creating encrypted ZIP', 
        error: error.message 
      });
    }
  }
};
