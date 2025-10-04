const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), 'components/client/booking/success/BookingSummaryCard.tsx');
let source = fs.readFileSync(filePath, 'utf8');

const oldImportBlock = "import { BlurView } from 'expo-blur';\nimport { LinearGradient } from 'expo-linear-gradient';\nimport React from 'react';\nimport { Animated, Platform, StyleSheet, View, Text, Dimensions } from 'react-native'; // ✅ NOVO: AccessibilityInfo para A11y\n\n";
