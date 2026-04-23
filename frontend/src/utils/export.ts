import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export const saveAndShareFile = async (data: string, filename: string, mimeType: string = 'text/csv') => {
  if (Platform.OS === 'web') {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return;
  }

  try {
    const fs = FileSystem as any;
    const cacheDir: string = fs.cacheDirectory ?? fs.documentDirectory ?? '';
    const fileUri = `${cacheDir}${filename}`;
    await (FileSystem as any).writeAsStringAsync(fileUri, data, { encoding: 'utf8' });
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, { mimeType, UTI: 'public.comma-separated-values-text' });
    } else {
      console.warn('Sharing is not available on this platform');
    }
  } catch (err) {
    console.error('Failed to export file:', err);
    throw err;
  }
};

