import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, Image as ImageIcon, Zap, ZapOff } from 'lucide-react-native';
import { InferenceUnavailableError, MODEL_VERSION, tfliteService } from '../services/tfliteService';
import { databaseService } from '../services/databaseService';
import { assessLeafImageQuality, ImageQualityWarning } from '../services/imagePreprocessing';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const cameraRef = React.useRef<any>(null);

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.textPrimary }]}>{t('cameraPermission')}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel={t('grantPermission')}
        >
          <Text style={styles.buttonText}>{t('grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const confirmUseAfterQualityCheck = async (warnings: ImageQualityWarning[]) => {
    const warningKeys: Record<ImageQualityWarning, TranslationKey> = {
      dark: 'qualityDark',
      bright: 'qualityBright',
      blurry: 'qualityBlurry',
      small: 'qualitySmall',
    };
    setAnalyzing(false);
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        t('qualityTitle'),
        warnings.map((warning) => t(warningKeys[warning])).join('\n\n'),
        [
          { text: t('retake'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('useAnyway'), onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  };

  const handleProcessImage = async (uri: string) => {
    try {
      setAnalyzing(true);
      const qualityWarnings = await assessLeafImageQuality(uri);
      if (
        qualityWarnings.length > 0 &&
        !(await confirmUseAfterQualityCheck(qualityWarnings))
      ) {
        return;
      }
      setAnalyzing(true);
      const result = await tfliteService.predict(uri);

      let savedLocally = false;
      let scanId: string | undefined;
      let savedAt: string | undefined;
      let persistedImageUri: string | undefined;
      try {
        if (!FileSystem.documentDirectory) {
          throw new Error('App document storage is unavailable.');
        }
        const imageDirectory = `${FileSystem.documentDirectory}scan-images/`;
        await FileSystem.makeDirectoryAsync(imageDirectory, { intermediates: true });
        const sourcePath = uri.split(/[?#]/, 1)[0];
        const extension = sourcePath.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
        const fileExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension ?? '')
          ? extension
          : 'jpg';
        persistedImageUri = `${imageDirectory}scan_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}.${fileExtension}`;
        await FileSystem.copyAsync({ from: uri, to: persistedImageUri });
        const savedRecord = await databaseService.insertDiagnosis({
          cropName: result.cropName,
          diseaseName: result.diseaseName,
          confidenceScore: result.confidenceScore,
          latencyMs: result.latencyMs,
          imageUri: persistedImageUri,
          modelVersion: MODEL_VERSION,
        });
        savedLocally = true;
        scanId = savedRecord.id;
        savedAt = savedRecord.timestamp;
      } catch (storageError) {
        console.error('Screening completed but local history could not be saved:', storageError);
        if (persistedImageUri) {
          try {
            await FileSystem.deleteAsync(persistedImageUri, { idempotent: true });
          } catch (cleanupError) {
            console.error('Could not remove an unindexed scan image:', cleanupError);
          }
        }
      }

      navigation.replace('Prediction', {
        imageUri: uri,
        cropName: result.cropName,
        diseaseName: result.diseaseName,
        confidence: result.confidenceScore,
        latencyMs: result.latencyMs,
        alternatives: result.alternatives,
        scanId,
        savedAt,
        savedLocally,
        modelVersion: MODEL_VERSION,
      });
      if (!savedLocally) Alert.alert(t('screeningResult'), t('resultNotSaved'));
    } catch (error) {
      console.error('Inference error:', error);
      Alert.alert(
        error instanceof InferenceUnavailableError
          ? t('modelErrorTitle')
          : t('imageErrorTitle'),
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
        } else {
          Alert.alert(t('imageErrorTitle'), t('cameraError'));
        }
      } catch (error) {
        console.error('Camera capture error:', error);
        Alert.alert(t('imageErrorTitle'), t('cameraError'));
      }
    }
  };

  const handlePickGallery = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!pickerResult.canceled && pickerResult.assets[0]?.uri) {
        await handleProcessImage(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error('Photo library error:', error);
      Alert.alert(t('imageErrorTitle'), t('galleryError'));
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
        <View style={[styles.headerOverlay, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={() => setTorch(!torch)}
            accessibilityRole="button"
            accessibilityLabel={torch ? t('torchOn') : t('torchOff')}
          >
            {torch ? <Zap size={22} color="#FBBF24" /> : <ZapOff size={22} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        {/* Viewfinder Target Framing */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.targetFrame}>
            <Text style={styles.frameInstruction}>{t('frameLeaf')}</Text>
          </View>
          <Text style={styles.cameraHelp}>{t('cameraHelp')}</Text>
        </View>

        {/* Bottom Control Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.sideButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={handlePickGallery}
            disabled={analyzing}
            accessibilityRole="button"
            accessibilityLabel={t('openGallery')}
          >
            <ImageIcon size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>{t('openGallery')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={handleCapture}
            disabled={analyzing}
            accessibilityRole="button"
            accessibilityLabel={t('takePhoto')}
          >
            <View style={[styles.shutterInner, { backgroundColor: colors.accent }]} />
          </TouchableOpacity>

          <View style={styles.placeholderSide} />
        </View>

        {analyzing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>{t('analyzing')}</Text>
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
  cameraHelp: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.62)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
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
    minHeight: 48,
    justifyContent: 'center',
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
    paddingTop: 20,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetFrame: {
    width: '80%',
    aspectRatio: 1,
    maxWidth: 320,
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
    paddingBottom: 24,
  },
  sideButton: {
    minWidth: 64,
    minHeight: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 2,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
  },
  placeholderSide: {
    width: 64,
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
