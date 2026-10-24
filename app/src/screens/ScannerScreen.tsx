import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, Camera, Image as ImageIcon, Zap, ZapOff } from 'lucide-react-native';
import { InferenceUnavailableError, tfliteService } from '../services/tfliteService';
import { databaseService } from '../services/databaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const cameraRef = React.useRef<any>(null);

  if (!permission) {
    return <View style={[styles.center, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.textPrimary }]}>
          Camera permission is required to scan crop leaves.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleProcessImage = async (uri: string) => {
    try {
      setAnalyzing(true);
      const result = await tfliteService.predict(uri);

      // Auto-save to SQLite Offline Database
      await databaseService.insertDiagnosis({
        cropName: result.cropName,
        diseaseName: result.diseaseName,
        confidenceScore: result.confidenceScore,
        latencyMs: result.latencyMs,
        imageUri: uri,
      });

      navigation.replace('Prediction', {
        imageUri: uri,
        cropName: result.cropName,
        diseaseName: result.diseaseName,
        confidence: result.confidenceScore,
        latencyMs: result.latencyMs,
      });
    } catch (error) {
      console.error('Inference error:', error);
      Alert.alert(
        error instanceof InferenceUnavailableError
          ? 'AI model not ready'
          : 'Could not analyze image',
        error instanceof Error
          ? error.message
          : 'Please try again with another photo.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current && !analyzing) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
        if (photo?.uri) {
          await handleProcessImage(photo.uri);
        }
      } catch (err) {
        console.error('Camera capture error:', err);
      }
    }
  };

  const handlePickGallery = async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]?.uri) {
      await handleProcessImage(pickerResult.assets[0].uri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        ref={cameraRef}
      >
        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={() => setTorch(!torch)}
          >
            {torch ? <Zap size={22} color="#FBBF24" /> : <ZapOff size={22} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        {/* Viewfinder Target Framing */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.targetFrame}>
            <Text style={styles.frameInstruction}>Align Leaf Within Frame</Text>
          </View>
        </View>

        {/* Bottom Control Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.sideButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={handlePickGallery}
            disabled={analyzing}
          >
            <ImageIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={handleCapture}
            disabled={analyzing}
          >
            <View style={[styles.shutterInner, { backgroundColor: colors.accent }]} />
          </TouchableOpacity>

          <View style={styles.placeholderSide} />
        </View>

        {analyzing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Analyzing leaf image...</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetFrame: {
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4ADE80',
    borderStyle: 'dashed',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  frameInstruction: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
  },
  sideButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderSide: {
    width: 52,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
});
