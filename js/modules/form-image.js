/**
 * Fichas ATM - Utilidades de Imagen para Fichas
 * Compresión en cliente en canvas y conversión a DataURL local (sin servidor).
 */

export async function compressImage(
  file,
  {
    maxDimension = 1920,
    quality = 0.85,
    maxSizeBytes = 5 * 1024 * 1024,
    preserveTransparency = false,
  } = {}
) {
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

          const isPng = file.type === "image/png";
          const keepAlpha = preserveTransparency || (isPng && preserveTransparency !== false);

          if (!keepAlpha) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          let outputType = "image/jpeg";
          let ext = "jpg";
          if (keepAlpha && isPng) {
            outputType = "image/png";
            ext = "png";
          } else if (file.type === "image/webp") {
            outputType = "image/webp";
            ext = "webp";
          }

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
 * Convierte pixeles blancos o casi blancos de una imagen en transparentes.
 * Muy útil para firmas fotografiadas o escaneadas sobre papel blanco.
 */
export async function makeWhiteTransparent(dataUrl, threshold = 215) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error("No se pudo procesar la imagen para transparencia."));
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Si el pixel es blanco o casi blanco
          if (r >= threshold && g >= threshold && b >= threshold) {
            d[i + 3] = 0; // Transparente
          } else if (r >= threshold - 35 && g >= threshold - 35 && b >= threshold - 35) {
            // Suavizado anti-alias en bordes
            const brightness = (r + g + b) / 3;
            const factor = Math.max(0, Math.min(1, (255 - brightness) / 45));
            d[i + 3] = Math.round(d[i + 3] * factor);
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.src = dataUrl;
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
