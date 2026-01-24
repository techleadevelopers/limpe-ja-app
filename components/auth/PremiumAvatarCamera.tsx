import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CameraComponent from 'expo-camera/build/ExpoCamera';
import { useCameraPermissions } from 'expo-camera';
import { CameraCapturedPicture } from 'expo-camera/build/Camera.types';
import * as FaceDetector from 'expo-face-detector';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  Svg,
} from 'react-native-svg';
import { FontAwesome } from '@expo/vector-icons';

const CAMERA_SIDE = 280;
const CameraAny = CameraComponent as React.ComponentType<any>;

export interface PremiumAvatarCameraProps {
  currentPhotoUri?: string | null;
  onCapture: (uri: string) => void;
}

export default function PremiumAvatarCamera({
  currentPhotoUri,
  onCapture,
}: PremiumAvatarCameraProps) {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [statusMessage, setStatusMessage] = useState(
    'Centralize o rosto dentro do círculo e mantenha a iluminação regular.',
  );
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const evaluateFace = useCallback((detectedFaces: FaceDetector.FaceFeature[]) => {
    if (!detectedFaces?.length) {
      setIsReady(false);
      setStatusMessage('Centralize o rosto dentro do círculo e mantenha a iluminação regular.');
      return;
    }

    const face = detectedFaces[0];
    const boundsWidth = face.bounds?.size?.width ?? 0;
    const yaw = Math.abs(face.yawAngle ?? 0);
    const roll = Math.abs(face.rollAngle ?? 0);
    const eyeOpenAvg =
      ((face.leftEyeOpenProbability ?? 0) + (face.rightEyeOpenProbability ?? 0)) / 2;

    const frontal = yaw < 12 && roll < 12;
    const lit = eyeOpenAvg >= 0.45;
    const coverage = boundsWidth >= 110;
    const ready = frontal && lit && coverage;
    setIsReady(ready);

    if (!coverage) {
      setStatusMessage('Aproxime levemente para o rosto preencher o círculo.');
    } else if (!frontal) {
      setStatusMessage('Mantenha o rosto alinhado ao centro, sem virar de lado.');
    } else if (!lit) {
      setStatusMessage('Evite sombras fortes e abra os olhos para detectar a luz.');
    } else {
      setStatusMessage('Perfeito! Toque em capturar para finalizar a foto.');
    }
  }, []);

  const handleFacesDetected = useCallback(
    ({ faces }: FaceDetector.DetectionResult) => {
      evaluateFace(faces);
    },
    [evaluateFace],
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !isReady) return;
    setIsCapturing(true);
    try {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: Platform.OS === 'android',
      });
      onCapture(photo.uri);
    } catch (error) {
      console.error('[PremiumAvatarCamera] capture failed', error);
    } finally {
      setIsCapturing(false);
    }
  }, [isReady, onCapture]);

  const readyLabel = useMemo(() => (isReady ? 'Capturar agora' : 'Aguarde validação'), [isReady]);

  if (!permission) {
    return (
      <View style={styles.permissionFallback}>
        <ActivityIndicator color="#3B82F6" />
        <Text style={styles.permissionSubtitle}>Solicitando acesso à câmera...</Text>
      </View>
    );
  }

  if (permission.status === 'denied') {
    return (
      <View style={styles.permissionFallback}>
        <Text style={styles.permissionTitle}>Permissão de câmera necessária</Text>
        <Text style={styles.permissionSubtitle}>
          Habilite o acesso à câmera nas configurações para capturar sua foto premium.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraAny
          ref={cameraRef}
          style={styles.cameraPreview}
          type="front"
          ratio="1:1"
          onFacesDetected={handleFacesDetected}
          faceDetectorSettings={{
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
            runClassifications: FaceDetector.FaceDetectorClassifications.all,
            minDetectionInterval: 200,
            tracking: true,
          }}
        />
        <Svg viewBox="0 0 200 200" style={styles.overlay} pointerEvents="none">
          <Defs>
            <SvgLinearGradient id="softGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="200" height="200" fill="url(#softGradient)" />
          <Circle cx="100" cy="70" r="34" stroke="#F8FAFC" strokeWidth="2" fill="none" />
          <Path
            d="M45 150 Q 70 120 100 120 Q 130 120 155 150 Q 160 165 150 180 H50 Q40 165 45 150 Z"
            stroke="#F8FAFC"
            strokeWidth="2"
            fill="none"
          />
        </Svg>
        {currentPhotoUri && (
          <View style={styles.previewBadge}>
            <Image source={{ uri: currentPhotoUri }} style={styles.previewImage} />
            <Text style={styles.previewLabel}>Foto atual</Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.statusText}>{statusMessage}</Text>
        <TouchableOpacity
          style={[styles.captureButton, !isReady && styles.captureButtonDisabled]}
          onPress={handleCapture}
          activeOpacity={0.9}
          disabled={!isReady || isCapturing}
        >
          <LinearGradient
            colors={['#7DB7FF', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.captureGradient}
          >
            {isCapturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="circle" size={16} color="#fff" />
                <Text style={styles.captureText}>{readyLabel}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Bom enquadramento, rosto centralizado e iluminação suave garantem a aprovação premium.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  cameraWrapper: {
    width: CAMERA_SIDE,
    height: CAMERA_SIDE,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  cameraPreview: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 13,
    color: '#CBD5F5',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 18,
  },
  captureButton: {
    width: 200,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  captureButtonDisabled: {
    opacity: 0.55,
  },
  captureGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  previewBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  previewImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#fff',
  },
  previewLabel: {
    fontSize: 10,
    color: '#E0E7FF',
    marginTop: 4,
  },
  permissionFallback: {
    width: CAMERA_SIDE,
    alignSelf: 'center',
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 15,
    color: '#f1f5f9',
    fontWeight: '700',
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
