/**
 * Shrink an image file to fit within maxSize px and re-encode as JPEG.
 * Phone photos are 3 to 5 MB; a 512 px avatar is all the app ever shows.
 * Resolves with the original file if the browser cannot decode it (e.g. HEIC).
 */
export const resizeImage = (file, maxSize = 512, quality = 0.85) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });

/** Upload a player photo to Supabase Storage and return its public URL. */
export const uploadPlayerPhoto = async (supabase, file) => {
  const resized = await resizeImage(file, 512);
  const isJpeg = resized !== file;
  const ext = isJpeg ? 'jpg' : (file.name.split('.').pop() || 'jpg');
  const path = `player-photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('basketball-stats')
    .upload(path, resized, isJpeg ? { contentType: 'image/jpeg' } : undefined);
  if (error) throw error;

  const { data } = supabase.storage.from('basketball-stats').getPublicUrl(path);
  return data.publicUrl;
};
