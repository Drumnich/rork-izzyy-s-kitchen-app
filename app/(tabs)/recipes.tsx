import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useRecipeStore } from '@/stores/recipe-store';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { Clock, Users, Plus } from 'lucide-react-native';

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, loadRecipes, isLoading } = useRecipeStore();
  const { currentUser } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cookie' | 'cake' | 'other'>('all');

  // Load recipes when component mounts
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const filteredRecipes = recipes.filter(recipe => 
    selectedCategory === 'all' || recipe.category === selectedCategory
  );

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleCreateRecipe = () => {
    console.log('📖 RecipesScreen - Create recipe button pressed');
    router.push('/create-recipe');
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'cookie', label: 'Cookies' },
    { key: 'cake', label: 'Cakes' },
    { key: 'other', label: 'Other' },
  ];

  if (!currentUser) {
    return null;
  }

  console.log('📖 RecipesScreen - Current user role:', currentUser.role, 'Should show + button:', currentUser.role === 'admin');

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Recipes",
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerRight: () => currentUser.role === 'admin' ? (
            <TouchableOpacity onPress={handleCreateRecipe} style={styles.createRecipeHeaderButton}>
              <Plus size={24} color={Colors.surface} />
              <Text style={styles.createRecipeHeaderButtonText}>Recipe</Text>
            </TouchableOpacity>
          ) : null,
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.title}>Recipe Collection</Text>
        <Text style={styles.subtitle}>
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      <View style={styles.categoryFilter}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.key as any)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.key && styles.categoryButtonTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Admin Create Recipe Button - Always visible for admin */}
      {currentUser.role === 'admin' && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.createRecipeButton} onPress={handleCreateRecipe}>
            <Plus size={24} color={Colors.surface} />
            <Text style={styles.createRecipeButtonText}>Create New Recipe</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      ) : filteredRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptySubtitle}>
            {currentUser.role === 'admin' 
              ? "Use the 'Create New Recipe' button above to add your first recipe" 
              : "Check back later for new recipes"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.recipeCard} 
              onPress={() => handleRecipePress(item.id)}
            >
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.recipeImage} />
              )}
              <View style={styles.recipeContent}>
                <Text style={styles.recipeName}>{item.name}</Text>
                <View style={styles.recipeInfo}>
                  <View style={styles.infoItem}>
                    <Users size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>{item.servings} servings</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Clock size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>{item.prepTime + item.cookTime} min</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  createRecipeHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    minHeight: 44,
    minWidth: 110,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  createRecipeHeaderButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  categoryFilter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: Colors.surface,
  },
  adminActions: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  createRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createRecipeButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  recipeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.border,
  },
  recipeContent: {
    padding: 16,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});