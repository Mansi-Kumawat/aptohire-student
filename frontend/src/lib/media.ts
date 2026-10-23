/**
 * Reads video duration client-side via loadedmetadata on an in-memory video element.
 */
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = objectUrl;
  });
}

/**
 * Strips EXIF metadata by drawing the image to a canvas (512x512 square crop)
 * and re-encoding as JPEG <= 1MB.
 */
export async function cropAndReencodeAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Center crop square
      const minDimension = Math.min(img.width, img.height);
      const startX = (img.width - minDimension) / 2;
      const startY = (img.height - minDimension) / 2;

      ctx.drawImage(
        img,
        startX,
        startY,
        minDimension,
        minDimension,
        0,
        0,
        512,
        512
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Avatar encoding failed'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image file'));
    };

    img.src = objectUrl;
  });
}
