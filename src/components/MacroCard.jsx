import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * MacroCard
 * Props:
 *   label     - string  e.g. "Protein"
 *   current   - number  e.g. 120
 *   goal      - number  e.g. 150
 *   unit      - string  e.g. "g" | "kcal"
 *   color     - string  hex color for accent
 *   showBar   - bool    show progress bar (default true)
 */
export default function MacroCard({
  label,
  current = 0,
  goal = 1,
  unit = 'g',
  color = '#e94560',
  showBar = true,
}) {
  const pct = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);
  const over = current > goal;

  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.pctBadge, { backgroundColor: color + '22', color }]}>
          {Math.round(pct)}%
        </Text>
      </View>

      <Text style={[styles.current, { color }]}>
        {Math.round(current)}
        <Text style={styles.unit}> {unit}</Text>
      </Text>

      <Text style={styles.goal}>Goal: {goal}{unit}</Text>

      {showBar && (
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                width: `${pct}%`,
                backgroundColor: over ? '#ff6b6b' : color,
              },
            ]}
          />
        </View>
      )}

      <Text style={[styles.remaining, over && { color: '#ff6b6b' }]}>
        {over
          ? `${Math.round(current - goal)}${unit} over`
          : `${Math.round(remaining)}${unit} left`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    borderTopWidth: 3,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pctBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  current: {
    fontSize: 26,
    fontWeight: '900',
  },
  unit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
  },
  goal: {
    color: '#555',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  barBg: {
    height: 5,
    backgroundColor: '#0f3460',
    borderRadius: 3,
    marginBottom: 6,
  },
  barFill: {
    height: 5,
    borderRadius: 3,
  },
  remaining: {
    color: '#50fa7b',
    fontSize: 11,
    fontWeight: '700',
  },
});