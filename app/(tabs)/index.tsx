import React, { useState, useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import * as ImageManipulator from 'expo-image-manipulator';

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

const getFileExtension = (filename: string) => {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
};

export default function HomeScreen() {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [savedEntries, setSavedEntries] = useState<FormData[]>([]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const entries = await loadEntries();
      setSavedEntries(entries);
    } catch (error) {
      console.error('Error loading entries:', error);
      alert('Failed to load saved entries');
    }
  };

  const pickImage = async (sourceType: 'camera' | 'library') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    setIsImageLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setFormData(prev => ({ ...prev, image: manipulatedImage.uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.slNo.trim() || !formData.location.trim()) {
      alert('Please fill in the Serial Number and Location fields.');
      return;
    }

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
      const exportData = await Promise.all(savedEntries.map(async (entry) => {
        let imageBase64 = '';
        let imageExtension = '';
        if (entry.image) {
          const imageFile = await FileSystem.readAsStringAsync(entry.image, { encoding: FileSystem.EncodingType.Base64 });
          imageExtension = getFileExtension(entry.image);
          imageBase64 = `data:image/${imageExtension};base64,${imageFile}`;
        }
        return {
          'Sl No': entry.slNo,
          'Location': entry.location,
          'Observation': entry.observation,
          'Priority': entry.priority,
          'Recommendation': entry.recommendation,
          'Status': entry.status,
          'Entry Date': new Date().toLocaleDateString(),
          'Image': imageBase64
        };
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Entries');
      
      ws['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 40 }, { wch: 15 },
        { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 50 }
      ];
      ws['!rows'] = exportData.map(() => ({ hpt: 150 }));

      exportData.forEach((entry, index) => {
        if (entry.Image) {
          const cellRef = XLSX.utils.encode_cell({ r: index + 1, c: 7 });
          ws[cellRef] = {
            t: 's',
            v: 'Image',
            s: { alignment: { vertical: 'center', horizontal: 'center' } }
          };
          const imageExtension = getFileExtension(entry.Image);
          ws[cellRef].l = {
            Target: entry.Image,
            Tooltip: 'Click to view full image'
          };
          ws[cellRef].s = {
            ...ws[cellRef].s,
            fill: { fgColor: { rgb: "FFFFAA00" } }
          };
        }
      });

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
          
          <ThemedText style={styles.fieldLabel}>Image</ThemedText>
          <ThemedView style={styles.imageButtonContainer}>
            <Button 
              mode="outlined" 
              onPress={() => pickImage('camera')}
              icon="camera"
              style={styles.imageButton}
            >
              Camera
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => pickImage('library')}
              icon="image-album"
              style={styles.imageButton}
            >
              Gallery
            </Button>
          </ThemedView>
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
    flex: 1,
  },
  pickedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
  imageButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
});

