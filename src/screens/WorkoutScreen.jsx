import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadWorkoutLog, saveWorkoutLog } from '../storage/storage';
import WorkoutItem from '../components/WorkoutItem';

const today = () => new Date().toISOString().split('T')[0];

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

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function WorkoutScreen({ navigation }) {
  const [entries, setEntries] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutLog(today()).then(setEntries);
    }, [])
  );

  const deleteEntry = (index) => {
    Alert.alert('Delete Exercise', 'Remove this exercise from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = entries.filter((_, i) => i !== index);
          setEntries(updated);
          await saveWorkoutLog(today(), updated);
        },
      },
    ]);
  };

  const totalVolume = entries.reduce((sum, e) => sum + (e.sets * e.reps * (parseFloat(e.weight) || 0)), 0);
  const totalSets = entries.reduce((sum, e) => sum + (parseInt(e.sets) || 0), 0);

  const renderItem = ({ item, index }) => (
    <WorkoutItem
      item={item}
      onLongPress={() => deleteEntry(index)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatCard label="Exercises" value={entries.length} color="#e94560" />
              <StatCard label="Total Sets" value={totalSets} color="#f5a623" />
              <StatCard label="Volume (kg)" value={Math.round(totalVolume)} color="#50fa7b" />
            </View>
            {entries.length > 0 && (
              <Text style={styles.sectionTitle}>TODAY'S EXERCISES</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts logged</Text>
            <Text style={styles.emptyHint}>Tap + in the top right to add an exercise</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      {entries.length > 0 && (
        <Text style={styles.deleteHint}>Long press an exercise to delete it</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  list: { padding: 16, paddingBottom: 48 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },

  sectionTitle: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  exerciseName: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  muscleTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  muscleTagText: { fontSize: 11, fontWeight: '700' },
  volumeWrap: { alignItems: 'flex-end' },
  volumeVal: { color: '#fff', fontSize: 20, fontWeight: '900' },
  volumeLabel: { color: '#555', fontSize: 11 },

  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setBadge: {
    backgroundColor: '#0f3460',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  setBadgeText: { color: '#ccc', fontSize: 12, fontWeight: '600' },

  notes: { color: '#666', fontSize: 12, marginTop: 8 },

  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyHint: { color: '#555', fontSize: 14, textAlign: 'center' },

  deleteHint: { textAlign: 'center', color: '#333', fontSize: 11, paddingBottom: 8 },
});