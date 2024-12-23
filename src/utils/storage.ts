import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormData } from '../types';

export const STORAGE_KEY = 'audit_entries';

export const saveEntries = async (entries: FormData[]) => {
  try {
    if (!entries || !Array.isArray(entries)) {
      throw new Error('Invalid entries data');
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Error saving entries:', error);
    throw error; // Rethrow to handle in component
  }
};

export const loadEntries = async (): Promise<FormData[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid stored data format');
    }
    return parsed;
  } catch (error) {
    console.error('Error loading entries:', error);
    throw error; // Rethrow to handle in component
  }
}; 