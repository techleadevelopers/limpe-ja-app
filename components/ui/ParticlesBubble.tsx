import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
// Adicione PaintStyle aqui
import { Canvas, Circle, Paint, BlendMode, Skia, SkPaint, PaintStyle } from '@shopify/react-native-skia';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useFrameCallback, FrameInfo } from 'react-native-reanimated';

// Obtém as dimensões da tela
const { width, height } = Dimensions.get('window');

// Funções auxiliares para replicar o comportamento original
const random = (min: number, max?: number): number => {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
};

const TWO_PI = Math.PI * 2; // Not directly used, but kept for consistency

// Construtor/Classe da Partícula
class Particle {
  x!: number;
  y!: number;
  vx!: number;
  vy!: number;
  radius!: number;
  baseRadius!: number;
  maxRadius!: number;
  threshold!: number;
  hue!: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reset();
  }

  // Reinicia as propriedades da partícula
  reset() {
    this.x = random(this.canvasWidth);
    this.y = random(this.canvasHeight, this.canvasHeight * 2); // Começa abaixo ou dentro da tela
    this.vx = 0;
    this.vy = -random(1, 10) / 5; // Velocidade inicial para cima
    this.radius = this.baseRadius = 1;
    this.maxRadius = 50;
    this.threshold = 150; // Distância do toque para o efeito de raio máximo
    this.hue = random(180, 240); // Tonalidade para o brilho azulado
  }

  // Atualiza a posição e o raio da partícula
  update(mouseX: number, mouseY: number) {
    const distx = this.x - mouseX;
    const disty = this.y - mouseY;
    const dist = Math.sqrt(distx * distx + disty * disty);

    if (dist < this.threshold) {
      let radius = this.baseRadius + ((this.threshold - dist) / this.threshold) * this.maxRadius;
      this.radius = radius > this.maxRadius ? this.maxRadius : radius;
    } else {
      this.radius = this.baseRadius;
    }

    this.vx += (random(100) - 50) / 1000;
    this.vy -= random(1, 20) / 10000;

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -this.maxRadius || this.x > this.canvasWidth + this.maxRadius || this.y < -this.maxRadius) {
      this.reset();
    }
  }
}

const ParticleEffect = () => {
  const particleCount = 750;
  const particles = useRef<Particle[]>([]);
  const mouseX = useSharedValue(width / 2);
  const mouseY = useSharedValue(height / 2);

  useEffect(() => {
    for (let i = 0; i < particleCount; i++) {
      particles.current.push(new Particle(width, height));
    }
  }, []);

  useFrameCallback((frameInfo: FrameInfo) => {
    for (let i = 0; i < particles.current.length; i++) {
      particles.current[i].update(mouseX.value, mouseY.value);
    }
  });

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      mouseX.value = event.x;
      mouseY.value = event.y;
    })
    .onUpdate((event) => {
      mouseX.value = event.x;
      mouseY.value = event.y;
    })
    .onEnd(() => {
      // Optional: you can reset mouse position or let particles float
    });

  // Usando Skia.Paint() e encadeando métodos para configurar suas propriedades
  const strokePaint = Skia.Paint();
  strokePaint.setStyle(PaintStyle.Stroke); // Agora PaintStyle está importado e reconhecido
  strokePaint.setStrokeWidth(1);
  strokePaint.setColor(Skia.Color('hsla(200, 50%, 50%, .4)'));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <Canvas style={styles.canvas}>
            {particles.current.map((particle, index) => {
              // Usando Skia.Paint() e encadeando métodos para configurar suas propriedades
              const currentFillPaint = Skia.Paint();
              currentFillPaint.setStyle(PaintStyle.Fill); // Agora PaintStyle está importado e reconhecido
              currentFillPaint.setColor(Skia.Color(`hsla(${particle.hue}, 60%, 40%, .35)`));
              currentFillPaint.setBlendMode(BlendMode.Plus);

              return (
                <Circle
                  key={index}
                  cx={particle.x}
                  cy={particle.y}
                  r={particle.radius}
                  paint={currentFillPaint}
                />
              );
            })}
            {particles.current.map((particle, index) => (
              <Circle
                key={`stroke-${index}`}
                cx={particle.x}
                cy={particle.y}
                r={particle.radius}
                paint={strokePaint}
              />
            ))}
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute', // Allows bubbles to be in the background
    bottom: 0,
    width: '100%',
    height: '100%', // Cover the entire area for bubbles to rise
    zIndex: -1, // Ensures bubbles are behind login content
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default ParticleEffect;