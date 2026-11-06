/**
 * Utilidad nativa de compresión y redimensionamiento de imágenes en el cliente para VetIA.
 * Utiliza HTML5 Canvas para procesar fotos pesadas de campo (de 5MB - 15MB a ~200KB - 300KB)
 * optimizando el ancho de banda en zonas rurales y acelerando la inferencia multimodal.
 *
 * @param {File|Blob} file - Archivo de imagen capturado en campo
 * @param {number} [maxWidth=1024] - Ancho máximo
 * @param {number} [maxHeight=1024] - Alto máximo
 * @param {number} [quality=0.75] - Nivel de compresión de calidad (0.0 a 1.0)
 * @returns {Promise<File>} Archivo comprimido listo para envío inmediato a la API o Supabase
 */
export async function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.75) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calcular nuevo tamaño respetando la relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Crear canvas en memoria
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Configurar interpolación y suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como JPEG optimizado
        const outputMime = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Normalizar nombre de archivo con extensión .jpg
            const baseName = (file.name || 'field_photo.jpg').replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}_opt.jpg`, {
              type: outputMime,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

export default compressImage;
