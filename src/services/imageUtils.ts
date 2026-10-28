/**
 * Utility to process, resize and compress user uploaded images
 * to optimize storage and maintain high visual clarity.
 */

export const DEFAULT_EXERCISE_IMAGE = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80';
export const DEFAULT_AVATAR_IMAGE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';

/**
 * Returns a valid, non-empty image URL or a safe fallback,
 * preventing empty string ("") attributes on <img> tags.
 */
export function getSafeImageUrl(url?: string | null, fallback = DEFAULT_EXERCISE_IMAGE): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  return url.trim();
}

export function processImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.88): Promise<{
  dataUrl: string;
  originalSizeKb: number;
  optimizedSizeKb: number;
  dimensions: { width: number; height: number };
}> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const rawUrl = e.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            originalSizeKb,
            optimizedSizeKb: originalSizeKb,
            dimensions: { width: img.width, height: img.height }
          });
          return;
        }

        // Draw image onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high quality JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const optimizedSizeKb = Math.round((dataUrl.length * (3 / 4)) / 1024);

        resolve({
          dataUrl,
          originalSizeKb,
          optimizedSizeKb,
          dimensions: { width, height }
        });
      };

      img.onerror = () => {
        reject(new Error('Não foi possível carregar a imagem. Verifique o formato do arquivo.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo de imagem do dispositivo.'));
    };

    reader.readAsDataURL(file);
  });
}
