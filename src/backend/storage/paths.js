export function checklistPhotoPath({ kitchenId, listId, itemId, fileName }) {
  return `kitchens/${kitchenId}/lists/${listId}/items/${itemId}/${fileName}`;
}
