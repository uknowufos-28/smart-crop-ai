import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions, CameraType, FlashMode } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, RefreshCw, Zap, ZapOff, CheckCircle } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";

interface CameraScannerProps {
  onImageCaptured: (imageUri: string) => void;
  isLoading?: boolean;
}

/**
 * Production Live Camera Leaf Capture & Photo Library Picker Component.
 */
export const CameraScanner: React.FC<CameraScannerProps> = ({
  onImageCaptured,
  isLoading = false,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  // 1. Permission Handling State
  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionCard}>
        <Camera size={48} color={COLORS.primary} style={styles.iconMargin} />
        <Text style={TYPOGRAPHY.titleCard}>Camera Access Required</Text>
        <Text style={[TYPOGRAPHY.bodyMedium, styles.permissionText]}>
          SmartCropAI requires camera permissions to scan crop leaves and diagnose plant diseases on-device.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Capture Image from Live Camera
  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        if (photo?.uri) {
          setPreviewUri(photo.uri);
          onImageCaptured(photo.uri);
        }
      } catch (error) {
        Alert.alert("Camera Error", "Failed to capture image. Please try again.");
      }
    }
  };

  // 3. Select Image from Device Photo Gallery
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        setPreviewUri(uri);
        onImageCaptured(uri);
      }
    } catch (error) {
      Alert.alert("Gallery Error", "Failed to select image from photo gallery.");
    }
  };

  // 4. Clear Preview & Reset Camera
  const handleRetake = () => {
    setPreviewUri(null);
  };

  // Render Captured Preview Screen
  if (previewUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: previewUri }} style={styles.previewImage} />

        <View style={styles.previewOverlay}>
          <View style={styles.successBadge}>
            <CheckCircle size={20} color={COLORS.success} />
            <Text style={styles.successBadgeText}>Leaf Image Selected</Text>
          </View>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}
            disabled={isLoading}
          >
            <RefreshCw size={20} color={COLORS.textPrimary} />
            <Text style={styles.retakeButtonText}>Scan Another Leaf</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render Live Camera Viewport
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.cameraView}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      >
        {/* Viewfinder Target Framing Guide */}
        <View style={styles.overlayContainer}>
          <View style={styles.viewfinderBox}>
            <Text style={styles.viewfinderText}>Position Infected Leaf Within Frame</Text>
          </View>
        </View>

        {/* Camera Control Bar */}
        <View style={styles.controlBar}>
          {/* Flash Toggle */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFlash(flash === "off" ? "on" : "off")}
          >
            {flash === "on" ? (
              <Zap size={24} color={COLORS.accent} />
            ) : (
              <ZapOff size={24} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>

          {/* Shutter Capture Button */}
          <TouchableOpacity
            style={styles.shutterOuterButton}
            onPress={handleTakePicture}
            disabled={isLoading}
          >
            <View style={styles.shutterInnerButton} />
          </TouchableOpacity>

          {/* Gallery Picker Toggle */}
          <TouchableOpacity style={styles.controlButton} onPress={handlePickFromGallery}>
            <ImageIcon size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  permissionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconMargin: {
    marginBottom: SPACING.md,
  },
  permissionText: {
    textAlign: "center",
    marginVertical: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  cameraContainer: {
    height: 420,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cameraView: {
    flex: 1,
    justifyContent: "space-between",
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinderBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderStyle: "dashed",
    borderRadius: RADIUS.lg,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: SPACING.md,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
  },
  viewfinderText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  controlBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: SPACING.md,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  shutterOuterButton: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.full,
    borderWidth: 4,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  shutterInnerButton: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  previewContainer: {
    height: 420,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    padding: SPACING.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  successBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  retakeButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
});
