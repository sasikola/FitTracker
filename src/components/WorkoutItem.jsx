import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';

const MUSCLE_COLORS = {
  Chest: '#e94560',
  Back: '#f5a623',
  Legs: '#50fa7b',
  Shoulders: '#8be9fd',
  Arms: '#bd93f9',
  Core: '#ffb86c',
  Cardio: '#ff79c6',
  Other: '#888',
};

const MUSCLE_ICONS = {
  Chest: '🫁',
  Back: '🔙',
  Legs: '🦵',
  Shoulders: '💪',
  Arms: '💪',
  Core: '🎯',
  Cardio: '🏃',
  Other: '⚡',
};

/**
 * WorkoutItem
 * Props:
 *   item        - { name, muscle, sets, reps, weight, setDetails, notes, time }
 *   onLongPress - function called on long press (for delete)
 */
export default function WorkoutItem({ item, onLongPress }) {
  const [expanded, setExpanded] = useState(false);

  const color = MUSCLE_COLORS[item.muscle] || MUSCLE_COLORS.Other;
  const icon = MUSCLE_ICONS[item.muscle] || '⚡';
  const volume = (item.sets || 0) * (item.reps || 0) * (parseFloat(item.weight) || 0);

  const timeLabel = item.time
    ? new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  // Build sets display: use setDetails if available, else repeat item.sets times
  const setDetails = item.setDetails && item.setDetails.length > 0
    ? item.setDetails
    : Array.from({ length: item.sets || 0 }, () => ({ reps: item.reps, weight: item.weight }));

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={onLongPress}
      onPress={toggle}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      {/* Colored left accent */}
      <View style={[styles.accent, { backgroundColor: color }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <View style={styles.nameWrap}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.tagRow}>
              {item.muscle ? (
                <View style={[styles.tag, { backgroundColor: color + '22', borderColor: color }]}>
                  <Text style={[styles.tagText, { color }]}>{item.muscle}</Text>
                </View>
              ) : null}
              {timeLabel ? (
                <Text style={styles.time}>{timeLabel}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.volWrap}>
            <Text style={[styles.volVal, { color }]}>{Math.round(volume)}</Text>
            <Text style={styles.volLabel}>kg vol</Text>
          </View>
        </View>

        {/* Set badges summary */}
        <View style={styles.badgesRow}>
          {setDetails.map((s, i) => (
            <View key={i} style={styles.badge}>
              <Text style={styles.badgeNum}>{i + 1}</Text>
              <Text style={styles.badgeText}>{s.reps}×{s.weight}kg</Text>
            </View>
          ))}
        </View>

        {/* Expandable detail */}
        {expanded && (
          <View style={styles.expandedWrap}>
            <View style={styles.divider} />
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{item.sets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{item.reps}</Text>
                <Text style={styles.statLabel}>Reps</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{item.weight}kg</Text>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color }]}>{Math.round(volume)}kg</Text>
                <Text style={styles.statLabel}>Volume</Text>
              </View>
            </View>
            {item.notes ? (
              <Text style={styles.notes}>📝 {item.notes}</Text>
            ) : null}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: { width: 4 },
  body: { flex: 1, padding: 14 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },

  nameWrap: { flex: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
  time: { color: '#555', fontSize: 11 },

  volWrap: { alignItems: 'flex-end' },
  volVal: { fontSize: 20, fontWeight: '900' },
  volLabel: { color: '#555', fontSize: 11 },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    backgroundColor: '#0f3460',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeNum: {
    color: '#8be9fd',
    fontSize: 11,
    fontWeight: '800',
    minWidth: 14,
  },
  badgeText: { color: '#ccc', fontSize: 12, fontWeight: '600' },

  expandedWrap: { marginTop: 12 },
  divider: { height: 1, backgroundColor: '#0f3460', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  statItem: { alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 2 },
  notes: { color: '#666', fontSize: 12 },
});