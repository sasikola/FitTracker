import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * FoodItem
 * Props:
 *   item        - { name, calories, protein, carbs, fats, time }
 *   onLongPress - function called when long-pressed (for delete)
 *   index       - number (for key)
 */
export default function FoodItem({ item, onLongPress }) {
  const timeLabel = item.time
    ? new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  // Macro distribution percentages for the mini bar
  const totalCal = item.calories || 1;
  const proteinCal = (item.protein || 0) * 4;
  const carbsCal = (item.carbs || 0) * 4;
  const fatsCal = (item.fats || 0) * 9;

  const pP = Math.round((proteinCal / totalCal) * 100);
  const pC = Math.round((carbsCal / totalCal) * 100);
  const pF = Math.round((fatsCal / totalCal) * 100);

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      delayLongPress={400}
    >
      {/* Left icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>🍽️</Text>
      </View>

      {/* Main info */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
        </View>

        {/* Macro text */}
        <Text style={styles.macros}>
          <Text style={styles.proteinText}>P {item.protein || 0}g</Text>
          {'  '}
          <Text style={styles.carbsText}>C {item.carbs || 0}g</Text>
          {'  '}
          <Text style={styles.fatsText}>F {item.fats || 0}g</Text>
        </Text>

        {/* Macro split bar */}
        <View style={styles.splitBar}>
          <View style={[styles.splitSegment, { flex: pP, backgroundColor: '#e94560' }]} />
          <View style={[styles.splitSegment, { flex: pC, backgroundColor: '#f5a623' }]} />
          <View style={[styles.splitSegment, { flex: pF, backgroundColor: '#50fa7b' }]} />
        </View>
      </View>

      {/* Calories */}
      <View style={styles.calWrap}>
        <Text style={styles.calories}>{Math.round(item.calories || 0)}</Text>
        <Text style={styles.kcal}>kcal</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },

  info: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  time: { color: '#555', fontSize: 11 },

  macros: { fontSize: 12, marginBottom: 6 },
  proteinText: { color: '#e94560', fontWeight: '600' },
  carbsText: { color: '#f5a623', fontWeight: '600' },
  fatsText: { color: '#50fa7b', fontWeight: '600' },

  splitBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#0f3460',
  },
  splitSegment: { height: 4 },

  calWrap: { alignItems: 'flex-end' },
  calories: { color: '#e94560', fontSize: 22, fontWeight: '900' },
  kcal: { color: '#555', fontSize: 11 },
});