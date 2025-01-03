import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image, Alert, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import * as Camera from 'expo-camera'; // Import the Camera API
import styles from './styles';
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
  low: { icon: 'shield-check', colors: { background: '#4CAF50', border: '#4CAF50' } },
  medium: { icon: 'shield-alert', colors: { background: '#FF9800', border: '#FF9800' } },
  high: { icon: 'shield-alert-outline', colors: { background: '#F44336', border: '#F44336' } }
};

export default function HomeScreen() {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [savedEntries, setSavedEntries] = useState<FormData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Camera state and permissions
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] =  useState(Camera.Constants.Type.back);
  const [cameraImageUri, setCameraImageUri] = useState<string | null>(null);

  // Load data on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        const entries = await loadEntries();
        setSavedEntries(entries);
      } catch (error) {
        console.error('Error loading entries:', error);
        Alert.alert('Failed to load saved entries');
      }
    };
    loadData();

    // Request Camera permission
    const requestPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    };
    requestPermissions();
  }, []);

  const validateImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to make this work!');
      return false;
    }
    return true;
  };

  // Pick image from library
  const pickImage = async () => {
    if (!(await validateImagePermissions())) return;

    setIsImageLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setFormData((prev) => ({ ...prev, image: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Failed to pick image');
    } finally {
      setIsImageLoading(false);
    }
  };

  // Capture image using the camera
  const cameraRef = useRef<Camera.CameraType | null>(null);

  const captureImage = async () => {
    if (cameraPermission === null || !cameraPermission) {
      Alert.alert('Permission denied', 'Camera permission is required to take pictures');
      return;
    }

    setIsImageLoading(true);

    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: true,
        });

        setFormData((prev) => ({ ...prev, image: photo.uri }));
        setCameraImageUri(photo.uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Failed to capture image');
    } finally {
      setIsImageLoading(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.slNo.trim()) errors.push('Serial Number');
    if (!formData.location.trim()) errors.push('Location');

    if (errors.length > 0) {
      Alert.alert('Missing Fields', `Please fill in the following required fields:\n${errors.join('\n')}`);
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
      Alert.alert('Success', 'Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = useCallback(() => {
    if (Object.values(formData).some((value) => value && value !== 'low')) {
      const confirm = window.confirm('Are you sure you want to start a new entry? Current data will be lost.');
      if (!confirm) return;
    }
    setFormData(initialFormState);
  }, [formData]);

  const exportToExcel = async () => {
    if (savedEntries.length === 0) {
      Alert.alert('No Entries', 'No entries to export');
      return;
    }

    setIsExporting(true);
    try {
      const exportData = savedEntries.map((entry) => ({
        'Sl No': entry.slNo,
        Location: entry.location,
        Observation: entry.observation,
        Priority: entry.priority,
        Recommendation: entry.recommendation,
        Status: entry.status,
        Image: entry.image || 'No Image',
        'Entry Date': new Date().toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Entries');

      ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 30 }];

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileName = `audit_entries_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Audit Entries',
      });

      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<Image source={require('@/assets/images/splashscreen_logo.png')} style={styles.logoImage} />}
    >
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
            onChangeText={(text) => setFormData((prev) => ({ ...prev, slNo: text }))}
            placeholder="Enter serial number"
          />
          <TextInput
            label="Location *"
            mode="outlined"
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, location: text }))}
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
            onChangeText={(text) => setFormData((prev) => ({ ...prev, observation: text }))}
            placeholder="Enter your observations here"
          />

          <ThemedText style={styles.fieldLabel}>Image</ThemedText>
          <Button mode="outlined" onPress={pickImage} icon="camera" style={styles.imageButton}>
            {formData.image ? 'Change Image' : 'Add Image from Gallery'}
          </Button>
          <Button mode="outlined" onPress={captureImage} icon="camera" style={styles.imageButton}>
            {formData.image ? 'Change Image' : 'Capture Image with Camera'}
          </Button>

          {formData.image && <Image source={{ uri: formData.image }} style={{ width: 100, height: 100, marginTop: 10 }} />}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Priority & Recommendations</ThemedText>
          <ThemedView style={styles.priorityContainer}>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <PriorityButton
                key={key}
                priority={key}
                currentPriority={formData.priority}
                onPress={() => setFormData((prev) => ({ ...prev, priority: key }))}
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
            onChangeText={(text) => setFormData((prev) => ({ ...prev, recommendation: text }))}
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
            onChangeText={(text) => setFormData((prev) => ({ ...prev, status: text }))}
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
          <Button mode="contained-tonal" onPress={handleAddNew} style={styles.actionButton} icon="plus" disabled={isSaving}>
            New Entry
          </Button>
        </ThemedView>

        <ThemedView style={styles.exportSection}>
          {savedEntries.length > 0 && (
            <ThemedView style={styles.savedEntriesCard}>
              <ThemedText style={styles.savedEntriesText}>Total Saved Entries: {savedEntries.length}</ThemedText>
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
