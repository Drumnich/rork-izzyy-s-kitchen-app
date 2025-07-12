import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/types/order';

interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  
  // Actions
  loadRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  getRecipeById: (recipeId: string) => Recipe | undefined;
  getRecipesByCategory: (category: Recipe['category']) => Recipe[];
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  isLoading: false,

  loadRecipes: async () => {
    set({ isLoading: true });
    try {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('📖 Recipe store - Load recipes error:', error);
        set({ isLoading: false });
        return;
      }

      const formattedRecipes: Recipe[] = recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        category: recipe.category as Recipe['category'],
        servings: recipe.servings,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        image: recipe.image || undefined,
      }));

      set({ recipes: formattedRecipes, isLoading: false });
    } catch (error) {
      console.error('📖 Recipe store - Load recipes error:', error);
      set({ isLoading: false });
    }
  },

  addRecipe: async (recipeData) => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          name: recipeData.name,
          category: recipeData.category,
          servings: recipeData.servings,
          prep_time: recipeData.prepTime,
          cook_time: recipeData.cookTime,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          image: recipeData.image || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('📖 Recipe store - Add recipe error:', error);
        throw error;
      }

      const newRecipe: Recipe = {
        id: data.id,
        name: data.name,
        category: data.category as Recipe['category'],
        servings: data.servings,
        prepTime: data.prep_time,
        cookTime: data.cook_time,
        ingredients: data.ingredients,
        instructions: data.instructions,
        image: data.image || undefined,
      };

      set((state) => ({ recipes: [newRecipe, ...state.recipes] }));
    } catch (error) {
      console.error('📖 Recipe store - Add recipe error:', error);
      throw error;
    }
  },

  updateRecipe: async (recipeId, updates) => {
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.servings) dbUpdates.servings = updates.servings;
      if (updates.prepTime) dbUpdates.prep_time = updates.prepTime;
      if (updates.cookTime) dbUpdates.cook_time = updates.cookTime;
      if (updates.ingredients) dbUpdates.ingredients = updates.ingredients;
      if (updates.instructions) dbUpdates.instructions = updates.instructions;
      if (updates.image !== undefined) dbUpdates.image = updates.image || null;

      const { data, error } = await supabase
        .from('recipes')
        .update(dbUpdates)
        .eq('id', recipeId)
        .select()
        .single();

      if (error) {
        console.error('📖 Recipe store - Update recipe error:', error);
        throw error;
      }

      const updatedRecipe: Recipe = {
        id: data.id,
        name: data.name,
        category: data.category as Recipe['category'],
        servings: data.servings,
        prepTime: data.prep_time,
        cookTime: data.cook_time,
        ingredients: data.ingredients,
        instructions: data.instructions,
        image: data.image || undefined,
      };

      set((state) => ({
        recipes: state.recipes.map((recipe) =>
          recipe.id === recipeId ? updatedRecipe : recipe
        ),
      }));
    } catch (error) {
      console.error('📖 Recipe store - Update recipe error:', error);
      throw error;
    }
  },

  deleteRecipe: async (recipeId) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) {
        console.error('📖 Recipe store - Delete recipe error:', error);
        throw error;
      }

      set((state) => ({
        recipes: state.recipes.filter((recipe) => recipe.id !== recipeId),
      }));
    } catch (error) {
      console.error('📖 Recipe store - Delete recipe error:', error);
      throw error;
    }
  },

  getRecipeById: (recipeId) => {
    return get().recipes.find((recipe) => recipe.id === recipeId);
  },

  getRecipesByCategory: (category) => {
    return get().recipes.filter((recipe) => recipe.category === category);
  },
}));