/**
 * Compress + resize an image in the browser before upload.
 * Dramatically reduces upload time (multi-MB photos → ~100-300KB).
 */
export interface CompressedImage {
  base64: string;
  contentType: string;
  fileName: string;
}

export async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.82
): Promise<CompressedImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not load image'));
    el.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Fallback: send original
    return {
      base64: dataUrl.split(',')[1],
      contentType: file.type,
      fileName: file.name,
    };
  }
  // White background so transparent PNGs don't turn black as JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const out = canvas.toDataURL('image/jpeg', quality);
  const base = (file.name.replace(/\.[^.]+$/, '') || 'product').slice(0, 60);
  return {
    base64: out.split(',')[1],
    contentType: 'image/jpeg',
    fileName: `${base}.jpg`,
  };
}
