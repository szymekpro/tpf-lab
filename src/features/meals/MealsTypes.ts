export type MealId =
  | 'breakfast'
  | 'second-breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'supper';

export type MealTone =
  | 'teal'
  | 'orange'
  | 'blue'
  | 'green'
  | 'pink'
  | 'cyan';

export type Product = {
  id: string;
  name: string;
  portion: string;
  calories: number;
  ww: number;
  wbt: number;
  carbs: number;
  category: 'fruit' | 'dish' | 'snack' | 'other';
  favorite?: boolean;
  frequent?: boolean;
  recent?: boolean;
};

export type SavedMealProduct = Product & {
  entryId: string;
  savedAt: string;
};

export type SavedMeals = Record<MealId, SavedMealProduct[]>;

export type MealSection = {
  id: MealId;
  name: string;
  tone: MealTone;
};

export const MEAL_SECTIONS: ReadonlyArray<MealSection> = [
  {
    id: 'breakfast',
    name: 'Śniadanie',
    tone: 'teal',
  },
  {
    id: 'second-breakfast',
    name: 'II Śniadanie',
    tone: 'orange',
  },
  {
    id: 'lunch',
    name: 'Lunch',
    tone: 'blue',
  },
  {
    id: 'dinner',
    name: 'Obiad',
    tone: 'green',
  },
  {
    id: 'snack',
    name: 'Przekąska',
    tone: 'pink',
  },
  {
    id: 'supper',
    name: 'Kolacja',
    tone: 'cyan',
  },
];

export const PRODUCTS: ReadonlyArray<Product> = [
  {
    id: 'apple',
    name: 'Jabłko',
    portion: '1 średnie (180 g)',
    calories: 94,
    ww: 1.8,
    wbt: 0,
    carbs: 18,
    category: 'fruit',
    favorite: true,
    frequent: true,
  },
  {
    id: 'bulgur',
    name: 'Kasza bulgur',
    portion: '100 g',
    calories: 111,
    ww: 2.3,
    wbt: 0.2,
    carbs: 23,
    category: 'dish',
    recent: true,
  },
  {
    id: 'egg',
    name: 'Jajko M',
    portion: '1 sztuka',
    calories: 78,
    ww: 0,
    wbt: 0.7,
    carbs: 0.6,
    category: 'dish',
    favorite: true,
    recent: true,
  },
  {
    id: 'banana',
    name: 'Banan',
    portion: '1 średni (120 g)',
    calories: 107,
    ww: 2.4,
    wbt: 0,
    carbs: 24,
    category: 'fruit',
    recent: true,
  },
  {
    id: 'raisins',
    name: 'Rodzynki',
    portion: '30 g',
    calories: 90,
    ww: 2.2,
    wbt: 0,
    carbs: 22,
    category: 'fruit',
    recent: true,
  },
  {
    id: 'oatmeal',
    name: 'Owsianka',
    portion: '250 g',
    calories: 250,
    ww: 3.5,
    wbt: 0.9,
    carbs: 35,
    category: 'dish',
    favorite: true,
  },
  {
    id: 'natural-yogurt',
    name: 'Jogurt naturalny',
    portion: '180 g',
    calories: 110,
    ww: 0.8,
    wbt: 0.5,
    carbs: 8,
    category: 'snack',
    favorite: true,
  },
  {
    id: 'chicken',
    name: 'Pierś z kurczaka',
    portion: '100 g',
    calories: 165,
    ww: 0,
    wbt: 1.7,
    carbs: 0,
    category: 'dish',
  },
  {
    id: 'bread',
    name: 'Pieczywo pełnoziarniste',
    portion: '2 kromki (70 g)',
    calories: 175,
    ww: 3.2,
    wbt: 0.3,
    carbs: 32,
    category: 'dish',
  },
];

export function createEmptySavedMeals(): SavedMeals {
  return {
    breakfast: [],
    'second-breakfast': [],
    lunch: [],
    dinner: [],
    snack: [],
    supper: [],
  };
}