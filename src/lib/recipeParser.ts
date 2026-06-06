import { Recipe } from '../types';
import { generateId } from './utils';

const INGREDIENT_CLUES = [
  /\d+\s*(cup|tbsp|tsp|tablespoon|teaspoon|oz|lb|g|kg|ml|l|clove|bunch|slice|piece|pinch|dash|handful|sprig|stalk)/i,
  /^[-•*]\s+\d/,
];

const SECTION_RE = {
  ingredients: /^(ingredients?|you'?ll? need|what you need|shopping list)\s*:?$/i,
  instructions: /^(instructions?|directions?|method|steps?|how to|preparation|procedure)\s*:?$/i,
};

export const parseRecipeText = (text: string): Partial<Recipe> => {
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!rawLines.length) return {};

  const title = rawLines[0];
  const lines = rawLines.slice(1);

  let ingStart = -1;
  let insStart = -1;

  lines.forEach((line, i) => {
    if (SECTION_RE.ingredients.test(line)) ingStart = i;
    if (SECTION_RE.instructions.test(line)) insStart = i;
  });

  let ingredients: string[] = [];
  let instructions: string[] = [];

  if (ingStart >= 0 && insStart > ingStart) {
    ingredients = lines
      .slice(ingStart + 1, insStart)
      .map(l => l.replace(/^[-•*]\s*/, '').trim())
      .filter(l => l.length > 1);
    instructions = lines
      .slice(insStart + 1)
      .map(l => l.replace(/^\d+[.)]\s*/, '').trim())
      .filter(l => l.length > 4);
  } else {
    lines.forEach(line => {
      const clean = line.replace(/^[-•*\d.)\s]+/, '').trim();
      if (clean.length < 2) return;
      if (/^\d+[.)]/.test(line) && clean.length > 15) {
        instructions.push(clean);
      } else if (INGREDIENT_CLUES.some(p => p.test(line))) {
        ingredients.push(clean);
      } else if (clean.length > 50) {
        instructions.push(clean);
      } else {
        ingredients.push(clean);
      }
    });
  }

  const prepMatch = text.match(/prep(?:\s*time)?\s*:?\s*(\d+\s*(?:min|hour|hr|minute)s?)/i);
  const cookMatch = text.match(/cook(?:\s*time)?\s*:?\s*(\d+\s*(?:min|hour|hr|minute)s?)/i);
  const servingsMatch = text.match(/(?:serves?|servings?|yield)\s*:?\s*(\d+[^\n,]*)/i);

  return {
    id: generateId(),
    title: title || 'Untitled Recipe',
    ingredients: ingredients.length ? ingredients : ['Could not parse ingredients — check the original'],
    instructions: instructions.length ? instructions : ['Could not parse instructions — check the original'],
    prepTime: prepMatch?.[1],
    cookTime: cookMatch?.[1],
    servings: servingsMatch?.[1]?.trim(),
    notes: [],
    savedAt: new Date().toISOString(),
  };
};

const MOCK_RECIPES: Array<Partial<Recipe>> = [
  {
    title: 'Crispy Baked Salmon with Lemon Herbs',
    description: 'A restaurant-quality salmon dish that comes together in under 25 minutes.',
    emoji: '🐟',
    ingredients: [
      '4 salmon fillets (6 oz each)',
      '2 tbsp olive oil',
      '3 cloves garlic, minced',
      '1 tbsp fresh dill, chopped',
      '1 tbsp fresh parsley, chopped',
      '1 lemon, zested and sliced',
      '½ tsp paprika',
      'Salt and black pepper to taste',
    ],
    instructions: [
      'Preheat oven to 425°F. Line a baking sheet with parchment paper.',
      'Pat salmon fillets dry with paper towels and arrange on the baking sheet.',
      'Mix olive oil, garlic, dill, parsley, and lemon zest. Brush all over the salmon.',
      'Season generously with salt, pepper, and paprika.',
      'Top with lemon slices and bake for 12–15 minutes until salmon flakes easily.',
      'Rest 2 minutes before serving.',
    ],
    prepTime: '10 min',
    cookTime: '15 min',
    servings: '4 people',
    tags: ['seafood', 'healthy', 'dinner'],
  },
  {
    title: 'Creamy Tuscan White Bean Soup',
    description: 'Hearty, comforting, and ready in 30 minutes. Pure weeknight magic.',
    emoji: '🍲',
    ingredients: [
      '2 cans (15 oz each) white beans, drained',
      '4 cloves garlic, minced',
      '1 onion, diced',
      '4 cups vegetable broth',
      '2 cups baby spinach',
      '1 can diced tomatoes',
      '2 tsp Italian seasoning',
      '3 tbsp olive oil',
      'Salt, pepper, and red pepper flakes',
      'Parmesan rind (optional but incredible)',
    ],
    instructions: [
      'Heat olive oil in a large pot over medium heat. Add onion and cook until softened, 5 min.',
      'Add garlic and Italian seasoning. Cook 1 minute until fragrant.',
      'Add beans, tomatoes, broth, and Parmesan rind. Bring to a simmer.',
      'Mash about ¼ of the beans with a fork against the pot to thicken the soup.',
      'Simmer 15 minutes. Add spinach and stir until wilted.',
      'Season with salt, pepper, and red pepper flakes. Remove Parmesan rind.',
      'Serve with crusty bread and extra Parmesan.',
    ],
    prepTime: '10 min',
    cookTime: '25 min',
    servings: '4 people',
    tags: ['soup', 'vegetarian', 'quick'],
  },
  {
    title: 'Honey Garlic Shrimp Stir Fry',
    description: 'Better than takeout in 15 minutes flat. The sauce is everything.',
    emoji: '🍤',
    ingredients: [
      '1 lb large shrimp, peeled and deveined',
      '4 cloves garlic, minced',
      '3 tbsp honey',
      '2 tbsp soy sauce',
      '1 tbsp rice vinegar',
      '1 tsp sesame oil',
      '1 tbsp cornstarch',
      '2 tbsp vegetable oil',
      'Scallions and sesame seeds to serve',
      'Steamed rice to serve',
    ],
    instructions: [
      'Pat shrimp dry and season with salt and pepper.',
      'Whisk together honey, soy sauce, rice vinegar, sesame oil, and cornstarch.',
      'Heat oil in a large wok or skillet over high heat until smoking.',
      'Add shrimp in a single layer. Cook 1–2 minutes per side until pink. Remove.',
      'Add garlic to the pan. Cook 30 seconds.',
      'Pour in sauce and cook until thickened, about 1 minute.',
      'Return shrimp and toss to coat. Serve immediately over rice.',
    ],
    prepTime: '5 min',
    cookTime: '10 min',
    servings: '3–4 people',
    tags: ['seafood', 'quick', 'asian'],
  },
];

export const parseRecipeFromUrl = (url: string): Partial<Recipe> => {
  const mock = MOCK_RECIPES[Math.floor(Math.random() * MOCK_RECIPES.length)];
  return {
    ...mock,
    id: generateId(),
    sourceUrl: url,
    notes: [],
    savedAt: new Date().toISOString(),
  };
};
