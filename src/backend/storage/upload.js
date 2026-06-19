import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorageInstance, isFirebaseConfigured } from "../config/firebase.js";
import { checklistPhotoPath } from "./paths.js";
import { createAppError } from "../core/errors.js";

export async function uploadChecklistPhoto({
  kitchenId,
  listId,
  itemId,
  file,
  fileName,
}) {
  if (!isFirebaseConfigured()) {
    throw createAppError(503, "Firebase Storage is not configured.");
  }

  if (!file) {
    throw createAppError(400, "Photo file is required.");
  }

  const safeName =
    typeof fileName === "string" && fileName.trim()
      ? fileName.trim()
      : `photo-${Date.now()}.jpg`;

  const path = checklistPhotoPath({
    kitchenId,
    listId,
    itemId,
    fileName: safeName,
  });

  const storageRef = ref(getStorageInstance(), path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { storagePath: path, url };
}
