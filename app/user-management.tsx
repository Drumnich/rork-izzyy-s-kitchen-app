import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore, User } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { UserRole } from '@/types/order';
import { Plus, Edit3, Trash2, User as UserIcon, Shield, Eye, EyeOff } from 'lucide-react-native';

export default function UserManagementScreen() {
  const router = useRouter();
  const { users, currentUser, loadUsers, createUser, updateUser, deleteUser } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'employee' as UserRole,
    pin: '',
  });
  const [showPin, setShowPin] = useState(false);

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const handleCreateUser = async () => {
    if (!formData.name.trim() || !formData.pin.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.pin.length < 4) {
      Alert.alert('Error', 'Login code must be at least 4 digits');
      return;
    }

    // Check if code already exists
    if (users.some(user => user.pin === formData.pin)) {
      Alert.alert('Error', 'This login code is already in use');
      return;
    }

    try {
      await createUser(formData.name.trim(), formData.role, formData.pin.trim());
      setFormData({ name: '', role: 'employee', pin: '' });
      setShowCreateForm(false);
      Alert.alert('Success', 'User created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create user. Please try again.');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !formData.name.trim() || !formData.pin.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.pin.length < 4) {
      Alert.alert('Error', 'Login code must be at least 4 digits');
      return;
    }

    // Check if code already exists (excluding current user)
    if (users.some(user => user.pin === formData.pin && user.id !== editingUser.id)) {
      Alert.alert('Error', 'This login code is already in use');
      return;
    }

    try {
      await updateUser(editingUser.id, {
        name: formData.name.trim(),
        role: formData.role,
        pin: formData.pin.trim(),
      });
      setFormData({ name: '', role: 'employee', pin: '' });
      setEditingUser(null);
      setShowCreateForm(false);
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      role: user.role,
      pin: user.pin,
    });
    setShowCreateForm(true);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingUser(null);
    setFormData({ name: '', role: 'employee', pin: '' });
    setShowPin(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'User Management',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerRight: () => !showCreateForm ? (
            <TouchableOpacity onPress={() => setShowCreateForm(true)} style={styles.headerButton}>
              <Plus size={20} color={Colors.text} />
            </TouchableOpacity>
          ) : null,
        }} 
      />

      {showCreateForm ? (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingUser ? 'Edit User' : 'Create New User'}
          </Text>

          <View style={styles.formField}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter user name"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'employee' && styles.roleButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, role: 'employee' }))}
              >
                <UserIcon size={16} color={formData.role === 'employee' ? Colors.surface : Colors.textSecondary} />
                <Text style={[
                  styles.roleButtonText,
                  formData.role === 'employee' && styles.roleButtonTextActive
                ]}>
                  Staff
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'admin' && styles.roleButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
              >
                <Shield size={16} color={formData.role === 'admin' ? Colors.surface : Colors.textSecondary} />
                <Text style={[
                  styles.roleButtonText,
                  formData.role === 'admin' && styles.roleButtonTextActive
                ]}>
                  Manager
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Login Code</Text>
            <View style={styles.pinInputRow}>
              <TextInput
                style={[styles.input, styles.pinInput]}
                value={formData.pin}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pin: text.replace(/[^0-9]/g, '') }))}
                placeholder="Enter login code"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                maxLength={8}
                secureTextEntry={!showPin}
              />
              <TouchableOpacity
                style={styles.pinToggle}
                onPress={() => setShowPin(!showPin)}
              >
                {showPin ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={editingUser ? handleUpdateUser : handleCreateUser}
            >
              <Text style={styles.saveButtonText}>
                {editingUser ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Kitchen Staff</Text>
            <Text style={styles.subtitle}>
              {users.length} user{users.length !== 1 ? 's' : ''} registered
            </Text>
          </View>

          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userIcon}>
                    {item.role === 'admin' ? (
                      <Shield size={20} color={Colors.primary} />
                    ) : (
                      <UserIcon size={20} color={Colors.textSecondary} />
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userRole}>
                      {item.role === 'admin' ? 'Kitchen Manager' : 'Kitchen Staff'}
                    </Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditUser(item)}
                  >
                    <Edit3 size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  {item.id !== currentUser.id && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteUser(item)}
                    >
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    padding: 8,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
  },
  formField: {
    marginBottom: 20,
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
  pinInputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  pinInput: {
    flex: 1,
  },
  pinToggle: {
    padding: 12,
    marginLeft: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  roleButtonTextActive: {
    color: Colors.surface,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
});