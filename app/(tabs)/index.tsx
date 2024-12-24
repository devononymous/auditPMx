import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

import { FormData } from '@/src/types';
import { saveEntries, loadEntries } from '@/src/utils/storage';
import { PriorityButton } from '@/src/components/PriorityButton';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const initialFormState: FormData = {
  slNo: '',
  location: '',
  observation: '',
  image: null,
  priority: 'low',
  recommendation: '',
  status: ''
};

const priorityConfig = {
  low: {
    icon: 'shield-check',
    colors: { background: '#4CAF50', border: '#4CAF50' }
  },
  medium: {
    icon: 'shield-alert',
    colors: { background: '#FF9800', border: '#FF9800' }
  },
  high: {
    icon: 'shield-alert-outline',
    colors: { background: '#F44336', border: '#F44336' }
  }
};

export default function HomeScreen() {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [savedEntries, setSavedEntries] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const entries = await loadEntries();
        if (mounted) {
          setSavedEntries(entries);
        }
      } catch (error) {
        console.error('Error loading entries:', error);
        if (mounted) {
          alert('Failed to load saved entries');
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const validateImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (!(await validateImage())) return;
    setIsImageLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          image: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    } finally {
      setIsImageLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.slNo.trim()) errors.push('Serial Number');
    if (!formData.location.trim()) errors.push('Location');
    
    if (errors.length > 0) {
      alert(`Please fill in the following required fields:\n${errors.join('\n')}`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const newEntries = [...savedEntries, formData];
      await saveEntries(newEntries);
      setSavedEntries(newEntries);
      setFormData(initialFormState);
      alert('Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = () => {
    if (Object.values(formData).some(value => value && value !== 'low')) {
      const confirm = window.confirm('Are you sure you want to start a new entry? Current data will be lost.');
      if (!confirm) return;
    }
    setFormData(initialFormState);
  };

  const exportToExcel = async () => {
    if (savedEntries.length === 0) {
      alert('No entries to export');
      return;
    }
    setIsExporting(true);
    try {
      const exportData = savedEntries.map((entry, index) => ({
        'Sl No': entry.slNo,
        'Location': entry.location,
        'Observation': entry.observation,
        'Priority': entry.priority,
        'Recommendation': entry.recommendation,
        'Status': entry.status,
        'Entry Date': new Date().toLocaleDateString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Entries');
      
      const colWidths = [
        { wch: 10 },
        { wch: 20 },
        { wch: 40 },
        { wch: 15 },
        { wch: 40 },
        { wch: 20 },
        { wch: 15 }
      ];
      ws['!cols'] = colWidths;
      
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      const fileName = `audit_entries_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Audit Entries',
        UTI: 'com.microsoft.excel.xlsx'
      });

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/splashscreen_logo.png')}
          style={styles.logoImage}
        />
      }>
      <ThemedView style={styles.formContainer}>
        <ThemedView style={styles.headerSection}>
          <ThemedText style={styles.formTitle}>Audit Entry Form</ThemedText>
          <ThemedText style={styles.formSubtitle}>Fill in the details below</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
          <TextInput 
            label="Sl no *"
            mode="outlined"
            style={styles.input}
            value={formData.slNo}
            onChangeText={(text) => setFormData(prev => ({ ...prev, slNo: text }))}
            placeholder="Enter serial number"
          />
          <TextInput 
            label="Location *"
            mode="outlined"
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="Enter location"
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Observation Details</ThemedText>
          <TextInput 
            label="Observation"
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.textArea}
            value={formData.observation}
            onChangeText={(text) => setFormData(prev => ({ ...prev, observation: text }))}
            placeholder="Enter your observations here"
          />
          
          <ThemedText style={styles.fieldLabel}>Add Photo Evidence</ThemedText>
          <Button 
            mode="outlined" 
            onPress={pickImage}
            icon="camera"
            style={styles.imageButton}
          >
            {formData.image ? 'Change Image' : 'Add Image'}
          </Button>
          {formData.image && (
            <Image source={{ uri: formData.image }} style={styles.pickedImage} />
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Priority & Recommendations</ThemedText>
          <ThemedView style={styles.priorityContainer}>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <PriorityButton
                key={key}
                priority={key}
                currentPriority={formData.priority}
                onPress={() => setFormData(prev => ({ ...prev, priority: key as FormData['priority'] }))}
                icon={config.icon}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                colors={config.colors}
              />
            ))}
          </ThemedView>

          <TextInput 
            label="Recommendation"
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.textArea}
            value={formData.recommendation}
            onChangeText={(text) => setFormData(prev => ({ ...prev, recommendation: text }))}
            placeholder="Enter your recommendations"
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Status</ThemedText>
          <TextInput 
            label="Current Status"
            mode="outlined"
            style={styles.input}
            value={formData.status}
            onChangeText={(text) => setFormData(prev => ({ ...prev, status: text }))}
            placeholder="Enter current status"
          />
        </ThemedView>

        <ThemedView style={styles.buttonContainer}>
          <Button 
            mode="contained"
            onPress={handleSave}
            style={styles.actionButton}
            icon="content-save"
            loading={isSaving}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Entry'}
          </Button>
          <Button 
            mode="contained-tonal"
            onPress={handleAddNew}
            style={styles.actionButton}
            icon="plus"
            disabled={isSaving}
          >
            New Entry
          </Button>
        </ThemedView>

        <ThemedView style={styles.exportSection}>
          {savedEntries.length > 0 && (
            <ThemedView style={styles.savedEntriesCard}>
              <ThemedText style={styles.savedEntriesText}>
                Total Saved Entries: {savedEntries.length}
              </ThemedText>
            </ThemedView>
          )}
          <Button 
            mode="contained"
            onPress={exportToExcel}
            icon="microsoft-excel"
            style={styles.exportButton}
            buttonColor="#217346"
            loading={isExporting}
            disabled={isExporting || savedEntries.length === 0}
          >
            {isExporting ? 'Exporting...' : 'Export All Data to Excel'}
          </Button>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
    gap: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  textArea: {
    backgroundColor: 'transparent',
    minHeight: 100,
  },
  imageButton: {
    marginVertical: 8,
  },
  pickedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  lowPriority: {
    backgroundColor: '#e8f5e9',
  },
  mediumPriority: {
    backgroundColor: '#fff3e0',
  },
  highPriority: {
    backgroundColor: '#ffebee',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  savedEntriesCard: {
    backgroundColor: 'rgba(33, 115, 70, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  savedEntriesText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  logoImage: {
    height: 120,
    width: 120,
    bottom: 20,
    alignSelf: 'center',
    position: 'absolute',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    borderRadius: 8,
  },
  priorityButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityButtonContent: {
    flexDirection: 'column',
    height: 70,
  },
});
