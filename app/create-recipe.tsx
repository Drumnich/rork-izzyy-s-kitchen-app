import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useRecipeStore } from '@/stores/recipe-store';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { Recipe } from '@/types/order';
import { Plus, X } from 'lucide-react-native';

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { addRecipe } = useRecipeStore();
  const { currentUser } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'cookie' as Recipe['category'],
    servings: '12',
    prepTime: '15',
    cookTime: '12',
    image: '',
  });
  
  const [ingredients, setIngredients] = useState([
    { name: '', amount: '', unit: '' }
  ]);
  
  const [instructions, setInstructions] = useState(['']);

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleUpdateIngredient = (index: number, field: string, value: string) => {
    const updated = ingredients.map((ingredient, i) => 
      i === index ? { ...ingredient, [field]: value } : ingredient
    );
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    const updated = instructions.map((instruction, i) => 
      i === index ? value : instruction
    );
    setInstructions(updated);
  };

  const handleCreateRecipe = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter recipe name');
      return;
    }

    if (!formData.servings || !formData.prepTime || !formData.cookTime) {
      Alert.alert('Error', 'Please fill in servings, prep time, and cook time');
      return;
    }

    const validIngredients = ingredients.filter(ing => 
      ing.name.trim() && ing.amount.trim() && ing.unit.trim()
    );

    if (validIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one complete ingredient');
      return;
    }

    const validInstructions = instructions.filter(inst => inst.trim());

    if (validInstructions.length === 0) {
      Alert.alert('Error', 'Please add at least one instruction');
      return;
    }

    const recipe: Omit<Recipe, 'id'> = {
      name: formData.name.trim(),
      category: formData.category,
      servings: parseInt(formData.servings),
      prepTime: parseInt(formData.prepTime),
      cookTime: parseInt(formData.cookTime),
      ingredients: validIngredients,
      instructions: validInstructions,
      image: formData.image.trim() || undefined,
    };

    addRecipe(recipe);
    Alert.alert('Success', 'Recipe created successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Create Recipe',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />

      <View style={styles.content}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Recipe Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter recipe name"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryButtons}>
              {(['cookie', 'cake', 'other'] as const).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.category === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category }))}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    formData.category === category && styles.categoryButtonTextActive
                  ]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Servings *</Text>
              <TextInput
                style={styles.input}
                value={formData.servings}
                onChangeText={(text) => setFormData(prev => ({ ...prev, servings: text.replace(/[^0-9]/g, '') }))}
                placeholder="12"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Prep Time (min) *</Text>
              <TextInput
                style={styles.input}
                value={formData.prepTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, prepTime: text.replace(/[^0-9]/g, '') }))}
                placeholder="15"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Cook Time (min) *</Text>
              <TextInput
                style={styles.input}
                value={formData.cookTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cookTime: text.replace(/[^0-9]/g, '') }))}
                placeholder="12"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Image URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.image}
              onChangeText={(text) => setFormData(prev => ({ ...prev, image: text }))}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddIngredient}>
              <Plus size={16} color={Colors.surface} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.ingredientInputs}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  value={ingredient.name}
                  onChangeText={(text) => handleUpdateIngredient(index, 'name', text)}
                  placeholder="Ingredient name"
                  placeholderTextColor={Colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={ingredient.amount}
                  onChangeText={(text) => handleUpdateIngredient(index, 'amount', text)}
                  placeholder="Amount"
                  placeholderTextColor={Colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={ingredient.unit}
                  onChangeText={(text) => handleUpdateIngredient(index, 'unit', text)}
                  placeholder="Unit"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
                  <X size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddInstruction}>
              <Plus size={16} color={Colors.surface} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.instructionInput]}
                value={instruction}
                onChangeText={(text) => handleUpdateInstruction(index, text)}
                placeholder="Enter instruction step"
                placeholderTextColor={Colors.textSecondary}
                multiline
              />
              {instructions.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveInstruction(index)}>
                  <X size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.createButton} onPress={handleCreateRecipe}>
          <Text style={styles.createButtonText}>Create Recipe</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: Colors.surface,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  stepNumberText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  instructionInput: {
    flex: 1,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});