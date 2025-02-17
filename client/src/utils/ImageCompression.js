import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 1, // Limit the size to 1MB
    maxWidthOrHeight: 800, // Max width or height
    useWebWorker: true, // Use a web worker to avoid blocking the main thread
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    throw error;
  }
};
