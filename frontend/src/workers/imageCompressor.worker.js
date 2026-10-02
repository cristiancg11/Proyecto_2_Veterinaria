/**
 * Dedicated Web Worker for Off-Thread Image Compression and Optimization.
 * Uses OffscreenCanvas and createImageBitmap to prevent UI frame drops.
 */

self.onmessage = async (event) => {
  const { file, maxWidth = 1280, maxHeight = 1280, quality = 0.82 } = event.data;

  try {
    if (!file) {
      throw new Error('No image file provided for compression.');
    }

    // Decode image asynchronously off the main thread
    const imageBitmap = await createImageBitmap(file);

    let { width, height } = imageBitmap;

    // Maintain aspect ratio while bounding to max constraints
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Render into OffscreenCanvas
    const offscreenCanvas = new OffscreenCanvas(width, height);
    const context = offscreenCanvas.getContext('2d');

    if (!context) {
      throw new Error('Could not acquire 2D rendering context on OffscreenCanvas.');
    }

    // High quality scaling
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(imageBitmap, 0, 0, width, height);

    // Convert to optimized JPEG/WebP Blob
    const compressedBlob = await offscreenCanvas.convertToBlob({
      type: 'image/jpeg',
      quality: quality,
    });

    // Close bitmap resource to free GPU/CPU memory
    imageBitmap.close();

    self.postMessage({
      success: true,
      blob: compressedBlob,
      originalSize: file.size,
      compressedSize: compressedBlob.size,
      dimensions: { width, height },
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message || 'Image compression failed inside worker.',
    });
  }
};
