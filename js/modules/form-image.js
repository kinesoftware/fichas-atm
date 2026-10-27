/**
 * Fichas ATM - Utilidades de Imagen para Fichas
 * Compresión en cliente en canvas y conversión a DataURL local (sin servidor).
 */

export async function compressImage(file, { maxDimension = 1920, quality = 0.82, maxSizeBytes = 5 * 1024 * 1024 } = {}) {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Formato de imagen no compatible. Usá JPG, PNG o WebP.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo de imagen."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida o está dañado."));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            if (file.size > maxSizeBytes) {
              reject(new Error("La imagen supera los 5 MB permitidos."));
              return;
            }
            resolve(file);
            return;
          }

          if (file.type === "image/png") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          const outputType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                if (file.size > maxSizeBytes) {
                  reject(new Error("La imagen supera los 5 MB permitidos."));
                  return;
                }
                resolve(file);
                return;
              }
              if (blob.size > maxSizeBytes) {
                reject(new Error("La imagen optimizada supera el límite de 5 MB. Probá con una imagen más liviana."));
                return;
              }
              const ext = outputType === "image/webp" ? "webp" : "jpg";
              const optimized = new File([blob], `adjunto.${ext}`, {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(optimized);
            },
            outputType,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte un File o Blob a DataURL base64 para persistencia directa en IndexedDB.
 * @param {Blob|File} blob
 * @returns {Promise<string>}
 */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Error al convertir imagen"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Devuelve la fecha de hoy en formato ISO (YYYY-MM-DD).
 * @returns {string}
 */
export function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
