import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * ProgressRing
 * A circular progress indicator using SVG.
 *
 * Props:
 *   size        - number   diameter of the ring (default 120)
 *   strokeWidth - number   ring thickness (default 10)
 *   current     - number   current value
 *   goal        - number   goal / max value
 *   color       - string   ring fill color (default '#e94560')
 *   label       - string   text shown below the value (e.g. "kcal")
 *   showPct     - bool     show percentage instead of raw value (default false)
 */
export default function ProgressRing({
  size = 120,
  strokeWidth = 10,
  current = 0,
  goal = 1,
  color = '#e94560',
  label = '',
  showPct = false,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(current / goal, 1);
  const strokeDashoffset = circumference * (1 - pct);
  const over = current > goal;
  const ringColor = over ? '#ff6b6b' : color;

  const displayValue = showPct
    ? `${Math.round(pct * 100)}%`
    : Math.round(current).toLocaleString();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0f3460"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.centerText}>
        <Text style={[styles.value, { color: ringColor, fontSize: size * 0.18 }]}>
          {displayValue}
        </Text>
        {label ? (
          <Text style={[styles.label, { fontSize: size * 0.1 }]}>{label}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '900',
    color: '#fff',
  },
  label: {
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
});