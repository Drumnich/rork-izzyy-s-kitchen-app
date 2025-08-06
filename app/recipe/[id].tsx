import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useRecipeStore } from '@/stores/recipe-store';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { Clock, Users, ChefHat, Trash2 } from 'lucide-react-native';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecipeById, deleteRecipe } = useRecipeStore();
  const { currentUser } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const recipe = getRecipeById(id!);

  if (!currentUser) {
    return null;
  }

  const handleDeleteRecipe = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe?.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!recipe) return;
            
            setIsDeleting(true);
            try {
              await deleteRecipe(recipe.id);
              console.log('🗑️ Recipe deleted successfully:', recipe.name);
              router.back();
            } catch (error) {
              console.error('❌ Failed to delete recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Recipe Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recipe not found</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: recipe.name,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerRight: () => currentUser.role === 'admin' ? (
            <TouchableOpacity 
              onPress={handleDeleteRecipe} 
              style={styles.deleteButton}
              disabled={isDeleting}
            >
              <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
          ) : null,
        }} 
      />

      {recipe.image && (
        <Image source={{ uri: recipe.image }} style={styles.heroImage} />
      )}

      <View style={styles.content}>
        <Text style={styles.recipeName}>{recipe.name}</Text>

        {/* Recipe Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Users size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{recipe.servings} servings</Text>
          </View>
          <View style={styles.infoItem}>
            <Clock size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Prep: {recipe.prepTime}m</Text>
          </View>
          <View style={styles.infoItem}>
            <ChefHat size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Cook: {recipe.cookTime}m</Text>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionsList}>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Admin Delete Button */}
        {currentUser.role === 'admin' && (
          <View style={styles.adminActions}>
            <TouchableOpacity 
              style={styles.deleteRecipeButton} 
              onPress={handleDeleteRecipe}
              disabled={isDeleting}
            >
              <Trash2 size={20} color={Colors.surface} />
              <Text style={styles.deleteRecipeButtonText}>
                {isDeleting ? 'Deleting...' : 'Delete Recipe'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.border,
  },
  content: {
    padding: 20,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  ingredientsList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  ingredientText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  adminActions: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.error,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteRecipeButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});