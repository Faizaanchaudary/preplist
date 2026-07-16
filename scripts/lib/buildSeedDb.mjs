import { companies } from "../../src/mocks/data/companies.data.js";
import { kitchens } from "../../src/mocks/data/kitchens.data.js";
import { users } from "../../src/mocks/data/users.data.js";
import { kitchenSections } from "../../src/mocks/data/kitchen-sections.data.js";
import { kitchenMemberships } from "../../src/mocks/data/kitchen-memberships.data.js";
import { accessCodes } from "../../src/mocks/data/access-codes.data.js";
import { lists } from "../../src/mocks/data/lists.data.js";
import { checklistItems } from "../../src/mocks/data/checklist-items.data.js";
import { templates } from "../../src/mocks/data/templates.data.js";
import { activityLogs } from "../../src/mocks/data/activity-logs.data.js";
import { listSnapshots } from "../../src/mocks/data/list-snapshots.data.js";
import { photos } from "../../src/mocks/data/photos.data.js";
import { completions } from "../../src/mocks/data/completions.data.js";
import { subscriptionPlans } from "../../src/mocks/data/subscription.data.js";
import { recipes } from "../../src/mocks/data/recipes.data.js";
import { recipeDrafts } from "../../src/mocks/data/recipe-drafts.data.js";
import { recipeCategories } from "../../src/mocks/data/recipe-categories.data.js";
import { templateCategories } from "../../src/mocks/data/template-categories.data.js";
import { activityCategories } from "../../src/mocks/data/activity-categories.data.js";

function deepClone(value) {
  return structuredClone(value);
}

export function buildSeedDb() {
  const seededAt = new Date().toISOString();

  return {
    version: 5,
    meta: {
      seededAt,
      lastCarryForwardRunAt: null,
    },
    companies: deepClone(companies),
    kitchens: deepClone(kitchens),
    users: deepClone(users),
    kitchenSections: deepClone(kitchenSections),
    kitchenMemberships: deepClone(kitchenMemberships),
    accessCodes: deepClone(accessCodes),
    lists: deepClone(lists),
    checklistItems: deepClone(checklistItems),
    templates: deepClone(templates),
    activityLogs: deepClone(activityLogs),
    listSnapshots: deepClone(listSnapshots),
    photos: deepClone(photos),
    completions: deepClone(completions),
    subscriptionPlans: deepClone(subscriptionPlans),
    recipes: deepClone(recipes),
    recipeDrafts: deepClone(recipeDrafts),
    // Category collections — hardcoded, seeded once
    recipeCategories: deepClone(recipeCategories),
    templateCategories: deepClone(templateCategories),
    activityCategories: deepClone(activityCategories),
  };
}
