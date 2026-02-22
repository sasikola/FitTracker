import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadFoodLog, loadWorkoutLog } from '../storage/storage';
import { sumMacros } from '../utils/calculations';
import { DAILY_GOALS } from '../constants/macros';
import MacroCard from '../components/MacroCard.jsx';
import ProgressRing from '../components/ProgressRing';

const { width } = Dimensions.get('window');

const today = () => new Date().toISOString().split('T')[0];

function MacroBar({ label, current, goal, color }) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <View style={styles.macroBarWrap}>
      <View style={styles.macroBarHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {Math.round(current)}<Text style={styles.macroGoal}>/{goal}g</Text>
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function CalorieRing({ current, goal }) {
  const pct = Math.min(current / goal, 1);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (1 - pct);
  const remaining = Math.max(goal - current, 0);
  const over = current > goal;

  return (
    <View style={styles.ringContainer}>
      <View style={styles.ringTextWrap}>
        <Text style={[styles.ringCalories, over && { color: '#ff6b6b' }]}>
          {Math.round(current)}
        </Text>
        <Text style={styles.ringLabel}>/ {goal} kcal</Text>
        <Text style={[styles.ringRemaining, over && { color: '#ff6b6b' }]}>
          {over ? `${Math.round(current - goal)} over` : `${Math.round(remaining)} left`}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [workouts, setWorkouts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const date = today();
        const food = await loadFoodLog(date);
        const w = await loadWorkoutLog(date);
        setTotals(sumMacros(food));
        setWorkouts(w);
      };
      load();
    }, [])
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning 🌅';
    if (h < 17) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
  };

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      {/* Calorie Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>TODAY'S CALORIES</Text>
        <View style={styles.ringRow}>
          <ProgressRing
            size={130}
            strokeWidth={12}
            current={totals.calories}
            goal={DAILY_GOALS.calories}
            color="#e94560"
            label="kcal"
          />
          <View style={styles.ringStats}>
            <Text style={styles.ringStatLabel}>Consumed</Text>
            <Text style={styles.ringStatVal}>{Math.round(totals.calories)} kcal</Text>
            <Text style={[styles.ringStatLabel, { marginTop: 10 }]}>Remaining</Text>
            <Text style={[styles.ringStatVal, totals.calories > DAILY_GOALS.calories && { color: '#ff6b6b' }]}>
              {Math.max(DAILY_GOALS.calories - Math.round(totals.calories), 0)} kcal
            </Text>
          </View>
        </View>
      </View>

      {/* Macro Cards */}
      <View style={styles.macroBoxRow}>
        <MacroCard label="Protein" current={totals.protein} goal={DAILY_GOALS.protein} unit="g" color="#e94560" />
        <MacroCard label="Carbs" current={totals.carbs} goal={DAILY_GOALS.carbs} unit="g" color="#f5a623" />
        <MacroCard label="Fats" current={totals.fats} goal={DAILY_GOALS.fats} unit="g" color="#50fa7b" />
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#e94560' }]}
          onPress={() => navigation.navigate('Food', { screen: 'AddFood' })}
        >
          <Text style={styles.actionIcon}>🍎</Text>
          <Text style={styles.actionText}>Log Food</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#16213e' }]}
          onPress={() => navigation.navigate('Workout', { screen: 'AddWorkout' })}
        >
          <Text style={styles.actionIcon}>🏋️</Text>
          <Text style={styles.actionText}>Log Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Workouts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>TODAY'S WORKOUTS</Text>
        {workouts.length === 0 ? (
          <Text style={styles.emptyText}>No workouts logged yet. Get moving! 💪</Text>
        ) : (
          workouts.map((w, i) => (
            <View key={i} style={styles.workoutRow}>
              <View style={styles.workoutDot} />
              <Text style={styles.workoutName}>{w.name}</Text>
              <Text style={styles.workoutDetail}>
                {w.sets} × {w.reps} @ {w.weight}kg
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 16, paddingBottom: 32 },

  header: { marginBottom: 20, marginTop: 8 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  date: { fontSize: 13, color: '#888', marginTop: 2 },

  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
  },

  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    marginBottom: 8,
  },
  ringTextWrap: { alignItems: 'center' },
  ringCalories: { fontSize: 48, fontWeight: '900', color: '#fff' },
  ringLabel: { fontSize: 14, color: '#888', marginTop: -4 },
  ringRemaining: { fontSize: 13, color: '#50fa7b', marginTop: 4, fontWeight: '600' },

  macrosWrap: { marginTop: 8, gap: 10 },
  macroBarWrap: { marginBottom: 4 },
  macroBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  macroLabel: { color: '#ccc', fontSize: 13 },
  macroValue: { color: '#fff', fontSize: 13, fontWeight: '700' },
  macroGoal: { color: '#888', fontWeight: '400' },
  barBg: { height: 6, backgroundColor: '#0f3460', borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },

  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  ringStats: { gap: 4 },
  ringStatLabel: { color: '#555', fontSize: 12 },
  ringStatVal: { color: '#fff', fontSize: 18, fontWeight: '800' },

  macroBoxRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  macroBox: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  macroBoxVal: { fontSize: 20, fontWeight: '900' },
  macroBoxLabel: { color: '#ccc', fontSize: 12, marginTop: 2 },
  macroBoxGoal: { color: '#555', fontSize: 11, marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: { fontSize: 24 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
    gap: 10,
  },
  workoutDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e94560' },
  workoutName: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 },
  workoutDetail: { color: '#888', fontSize: 13 },
});