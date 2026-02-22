import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, StatusBar,
} from 'react-native';import { useFocusEffect } from '@react-navigation/native';
import { loadFoodLog, saveFoodLog } from '../storage/storage';
import { sumMacros } from '../utils/calculations';
import { DAILY_GOALS } from '../constants/macros';
import FoodItem from '../components/FoodItem';

const today = () => new Date().toISOString().split('T')[0];

function MacroChip({ label, value, color }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.chipVal, { color }]}>{Math.round(value)}g</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function SummaryBar({ totals }) {
  const calPct = Math.min((totals.calories / DAILY_GOALS.calories) * 100, 100);
  const over = totals.calories > DAILY_GOALS.calories;
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View>
          <Text style={styles.summaryTitle}>TODAY</Text>
          <Text style={[styles.summaryCalories, over && { color: '#ff6b6b' }]}>
            {Math.round(totals.calories)} <Text style={styles.summaryGoal}>/ {DAILY_GOALS.calories} kcal</Text>
          </Text>
        </View>
        <View style={styles.summaryChips}>
          <MacroChip label="P" value={totals.protein} color="#e94560" />
          <MacroChip label="C" value={totals.carbs} color="#f5a623" />
          <MacroChip label="F" value={totals.fats} color="#50fa7b" />
        </View>
      </View>
      <View style={styles.calBarBg}>
        <View style={[
          styles.calBarFill,
          { width: `${calPct}%`, backgroundColor: over ? '#ff6b6b' : '#e94560' }
        ]} />
      </View>
    </View>
  );
}

export default function FoodLogScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const totals = sumMacros(entries);

  useFocusEffect(
    useCallback(() => {
      loadFoodLog(today()).then(setEntries);
    }, [])
  );

  const deleteEntry = (index) => {
    Alert.alert('Delete Entry', 'Remove this food from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = entries.filter((_, i) => i !== index);
          setEntries(updated);
          await saveFoodLog(today(), updated);
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <FoodItem
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
        ListHeaderComponent={<SummaryBar totals={totals} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No food logged yet</Text>
            <Text style={styles.emptyHint}>Tap + in the top right to add your first meal</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <Text style={styles.deleteHint}>Long press an entry to delete it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  list: { padding: 16, paddingBottom: 48 },

  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryTitle: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  summaryCalories: { fontSize: 28, fontWeight: '900', color: '#fff' },
  summaryGoal: { fontSize: 16, fontWeight: '400', color: '#888' },
  summaryChips: { flexDirection: 'row', gap: 6 },
  chip: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chipVal: { fontSize: 13, fontWeight: '800' },
  chipLabel: { fontSize: 10, color: '#888' },
  calBarBg: { height: 6, backgroundColor: '#0f3460', borderRadius: 3 },
  calBarFill: { height: 6, borderRadius: 3 },

  entryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  entryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryIcon: { fontSize: 20 },
  entryName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  entryMacros: { color: '#666', fontSize: 12, marginTop: 2 },
  entryRight: { alignItems: 'flex-end' },
  entryCal: { color: '#e94560', fontSize: 22, fontWeight: '900' },
  entryCalLabel: { color: '#555', fontSize: 11 },

  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyHint: { color: '#555', fontSize: 14, textAlign: 'center' },

  deleteHint: {
    textAlign: 'center',
    color: '#333',
    fontSize: 11,
    paddingBottom: 8,
  },
});