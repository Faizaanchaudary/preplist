import { isFirebaseConfigured } from "../backend/config/firebase.js";
import { uploadRecipePhoto } from "../backend/storage/upload.js";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const useFirebase = import.meta.env.VITE_DATA_SOURCE === "firebase";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

function assertValidImageFile(file) {
  if (!file) {
    throw new Error("Please select an image file.");
  }

  if (!String(file.type).startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Image must be smaller than 10 MB.");
  }
}

export async function uploadRecipePhotoFile({ file }) {
  assertValidImageFile(file);

  if (useFirebase && isFirebaseConfigured()) {
    const fileName =
      typeof file.name === "string" && file.name.trim()
        ? file.name.trim()
        : `recipe-${Date.now()}.jpg`;

    return uploadRecipePhoto({
      file,
      fileName,
    });
  }

  const url = await readFileAsDataUrl(file);
  return { storagePath: null, url };
}
