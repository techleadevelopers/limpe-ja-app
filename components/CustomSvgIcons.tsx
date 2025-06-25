// LimpeJaApp/components/CustomSvgIcons.tsx
import React from 'react';
import Svg, { Path, G, Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';

interface SvgIconProps {
  size?: number;
  color?: string; // Cor base para o azul do ícone
}

const defaultColor = "#007AFF"; // Seu azul moderno
const lightBlue = "#66B3FF";
const darkerBlue = "#005BB5";

// --- Ícone Residencial (Casa) ---
export const HomeIcon3D: React.FC<SvgIconProps> = ({ size = 32, color = defaultColor }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      {/* Ensure no text or extra whitespace directly between <LinearGradient> and <Stop> tags */}
      <LinearGradient id="homeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={lightBlue} />
        <Stop offset="100%" stopColor={darkerBlue} />
      </LinearGradient>
      <LinearGradient id="roofGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4DB3FF" />
        <Stop offset="100%" stopColor="#007AFF" />
      </LinearGradient>
    </Defs>
    {/* Base da casa (com sombra sutil) */}
    <G transform="translate(0, 1)">
        <Path
            d="M4 11.5L12 3.5L20 11.5V20H4V11.5Z"
            fill="url(#homeGradient)"
            stroke={darkerBlue}
            strokeWidth="0.5"
            strokeLinejoin="round"
        />
        {/* Janela sutil 1 */}
        <Rect x="7" y="14" width="3" height="3" fill="#ADD8E6" rx="0.5" ry="0.5" />
        {/* Janela sutil 2 */}
        <Rect x="14" y="14" width="3" height="3" fill="#ADD8E6" rx="0.5" ry="0.5" />
        {/* Porta */}
        <Rect x="10.5" y="15.5" width="3" height="4.5" fill="#333" rx="0.5" ry="0.5" />
    </G>
    {/* Telhado */}
    <Path
        d="M2 11.5L12 1.5L22 11.5"
        fill="url(#roofGradient)"
        stroke={darkerBlue}
        strokeWidth="0.5"
        strokeLinejoin="round"
    />
  </Svg>
);

// --- Ícone Comercial (Prédio) ---
export const CommercialIcon3D: React.FC<SvgIconProps> = ({ size = 32, color = defaultColor }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="buildingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={lightBlue} />
        <Stop offset="100%" stopColor={darkerBlue} />
      </LinearGradient>
      <LinearGradient id="windowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ADD8E6" />
        <Stop offset="100%" stopColor="#87CEEB" />
      </LinearGradient>
    </Defs>
    {/* Corpo do prédio */}
    <Rect x="5" y="4" width="14" height="18" fill="url(#buildingGradient)" rx="2" ry="2" />
    {/* Janelas */}
    <G>
      <Rect x="7" y="6" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />
      <Rect x="11" y="6" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />
      <Rect x="15" y="6" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />

      <Rect x="7" y="10" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />
      <Rect x="11" y="10" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />
      <Rect x="15" y="10" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />

      <Rect x="7" y="14" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />
      <Rect x="11" y="14" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />
      <Rect x="15" y="14" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />

      <Rect x="11" y="18" width="3" height="3" fill="url(#windowGradient)" rx="0.5" ry="0.5" />
    </G>
  </Svg>
);

// --- Ícone Pós-Obra (Rodo e Balde/Vassoura estilizada) ---
export const PostConstructionIcon3D: React.FC<SvgIconProps> = ({ size = 32, color = defaultColor }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="mopHandleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A0A0A0" />
        <Stop offset="100%" stopColor="#606060" />
      </LinearGradient>
      <LinearGradient id="mopHeadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={lightBlue} />
        <Stop offset="100%" stopColor={darkerBlue} />
      </LinearGradient>
      <LinearGradient id="bucketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#87CEEB" />
        <Stop offset="100%" stopColor="#4DB3FF" />
      </LinearGradient>
    </Defs>
    {/* Balde (ou base do rodo) */}
    <Path
      d="M17 14L19 22H5L7 14H17Z"
      fill="url(#bucketGradient)"
      stroke={darkerBlue}
      strokeWidth="0.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {/* Cabo do rodo/vassoura */}
    <Path
      d="M12 2L12 14"
      stroke="url(#mopHandleGradient)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Ponta do rodo (para dar um toque de limpeza) */}
    <Rect x="9" y="13" width="6" height="1.5" fill={darkerBlue} rx="0.5" ry="0.5" />
    <Circle cx="12" cy="14" r="1.5" fill={darkerBlue} />
  </Svg>
);


// --- Ícone Vidros (Janela) ---
export const GlassIcon3D: React.FC<SvgIconProps> = ({ size = 32, color = defaultColor }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={lightBlue} />
        <Stop offset="100%" stopColor={darkerBlue} />
      </LinearGradient>
      <LinearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ADD8E6" />
        <Stop offset="100%" stopColor="#E0FFFF" />
      </LinearGradient>
    </Defs>
    {/* Moldura externa */}
    <Rect x="4" y="4" width="16" height="16" fill="url(#frameGradient)" rx="2" ry="2" />
    {/* Vidro interno */}
    <Rect x="5" y="5" width="14" height="14" fill="url(#glassGradient)" rx="1.5" ry="1.5" />
    {/* Divisores de janela */}
    <Path
      d="M12 5V19M5 12H19"
      stroke={darkerBlue}
      strokeWidth="1"
      strokeLinecap="round"
    />
    {/* Reflexo sutil */}
    <Path
      d="M6 6L11 6V11L6 11Z"
      fill="rgba(255,255,255,0.3)"
      opacity="0.5"
    />
  </Svg>
);