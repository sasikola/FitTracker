import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { loadFoodLog, loadWorkoutLog } from '../storage/storage';
import { sumMacros } from '../utils/calculations';
import { DAILY_GOALS } from '../constants/macros';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getDayLabel(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateStr).getDay()];
}

function sanitizeChartData(arr) {
  const clean = arr.map(v => {
    const n = Number(v);
    return isFinite(n) && !isNaN(n) ? Math.max(0, Math.round(n)) : 0;
  });
  const hasRealData = clean.some(v => v > 0);
  if (!hasRealData) {
    return clean.map((v, i) => (i === clean.length - 1 ? 0.001 : v));
  }
  return clean;
}

const chartConfig = {
  backgroundGradientFrom: '#1a1a2e',
  backgroundGradientTo: '#1a1a2e',
  color: (opacity = 1) => `rgba(233, 69, 96, ${opacity})`,
  labelColor: () => '#888',
  strokeWidth: 2,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#e94560' },
  propsForBackgroundLines: { stroke: '#16213e' },
  decimalPlaces: 0,
};

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function StatSummary({ label, value, unit, goal, color }) {
  const avg = Math.round(value);
  const pct = goal > 0 ? Math.round((avg / goal) * 100) : 0;
  const pctColor = pct >= 90 ? '#50fa7b' : pct >= 60 ? '#f5a623' : '#ff6b6b';
  return (
    <View style={[styles.statSummary, { borderLeftColor: color }]}>
      <Text style={styles.statSummaryLabel}>{label}</Text>
      <View style={styles.statSummaryRow}>
        <Text style={[styles.statSummaryVal, { color }]}>
          {avg}
          <Text style={styles.statSummaryUnit}>{unit}</Text>
        </Text>
        <Text style={[styles.statSummaryPct, { color: pctColor }]}>{pct}%</Text>
      </View>
      <Text style={styles.statSummaryGoal}>7-day avg · Goal: {goal}{unit}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const [weekData, setWeekData] = useState(
    Array.from({ length: 7 }, () => ({ calories: 0, protein: 0, carbs: 0, fats: 0 }))
  );
  const [workoutCounts, setWorkoutCounts] = useState(Array(7).fill(0));

  const dates = getLast7Days();

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const foodData = await Promise.all(dates.map(d => loadFoodLog(d)));
        const workData = await Promise.all(dates.map(d => loadWorkoutLog(d)));
        setWeekData(foodData.map(e => sumMacros(e)));
        setWorkoutCounts(workData.map(e => e.length));
      };
      load();
    }, [])
  );

  const labels = dates.map(getDayLabel);

  // Raw values for averages (real numbers, not stubbed)
  const rawCalories = weekData.map(d => d.calories || 0);
  const rawProteins = weekData.map(d => d.protein || 0);
  const rawCarbs    = weekData.map(d => d.carbs || 0);
  const rawFats     = weekData.map(d => d.fats || 0);

  // static values for charts only (prevents SVG crash on all-zero data)
  const chartCalories = sanitizeChartData(rawCalories);
  const chartProteins = sanitizeChartData(rawProteins);
  const chartCarbs    = sanitizeChartData(rawCarbs);
  const chartFats     = sanitizeChartData(rawFats);
  const chartWorkouts = sanitizeChartData(workoutCounts);

  // Averages use raw data
  const avgCal        = rawCalories.reduce((a, b) => a + b, 0) / 7;
  const avgProtein    = rawProteins.reduce((a, b) => a + b, 0) / 7;
  const avgCarbs      = rawCarbs.reduce((a, b) => a + b, 0) / 7;
  const avgFats       = rawFats.reduce((a, b) => a + b, 0) / 7;
  const totalWorkouts = workoutCounts.reduce((a, b) => a + b, 0);
  const activeDays    = workoutCounts.filter(w => w > 0).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>7-Day Progress</Text>
        <Text style={styles.headerSub}>Your last 7 days at a glance</Text>
      </View>

      {/* Avg Summary Cards */}
      <View style={styles.summaryGrid}>
        <StatSummary label="Calories" value={avgCal}     unit=" kcal" goal={DAILY_GOALS.calories} color="#e94560" />
        <StatSummary label="Protein"  value={avgProtein} unit="g"     goal={DAILY_GOALS.protein}  color="#e94560" />
        <StatSummary label="Carbs"    value={avgCarbs}   unit="g"     goal={DAILY_GOALS.carbs}    color="#f5a623" />
        <StatSummary label="Fats"     value={avgFats}    unit="g"     goal={DAILY_GOALS.fats}     color="#50fa7b" />
      </View>

      {/* Workout Stats */}
      <View style={styles.workoutStatsRow}>
        <View style={styles.workoutStatCard}>
          <Text style={styles.workoutStatVal}>{activeDays}</Text>
          <Text style={styles.workoutStatLabel}>Active Days</Text>
        </View>
        <View style={[styles.workoutStatCard, { borderTopColor: '#f5a623' }]}>
          <Text style={[styles.workoutStatVal, { color: '#f5a623' }]}>{totalWorkouts}</Text>
          <Text style={styles.workoutStatLabel}>Exercises Logged</Text>
        </View>
      </View>

      {/* Calorie Bar Chart */}
      <View style={styles.chartCard}>
        <SectionTitle>CALORIES — LAST 7 DAYS</SectionTitle>
        <View style={styles.goalLine}>
          <View style={styles.goalDash} />
          <Text style={styles.goalLineLabel}>Goal: {DAILY_GOALS.calories} kcal</Text>
        </View>
        <BarChart
          data={{ labels, datasets: [{ data: chartCalories }] }}
          width={CHART_WIDTH}
          height={190}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(233, 69, 96, ${opacity})`,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
          withInnerLines
        />
      </View>

      {/* Protein Line Chart */}
      <View style={styles.chartCard}>
        <SectionTitle>PROTEIN (g) — LAST 7 DAYS</SectionTitle>
        <LineChart
          data={{
            labels,
            datasets: [{ data: chartProteins, color: () => '#e94560' }],
          }}
          width={CHART_WIDTH}
          height={190}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(233, 69, 96, ${opacity})`,
          }}
          style={styles.chart}
          bezier
          withDots
          fromZero
        />
      </View>

      {/* Carbs + Fats Combined Line Chart */}
      <View style={styles.chartCard}>
        <SectionTitle>CARBS & FATS (g) — LAST 7 DAYS</SectionTitle>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f5a623' }]} />
            <Text style={styles.legendLabel}>Carbs</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#50fa7b' }]} />
            <Text style={styles.legendLabel}>Fats</Text>
          </View>
        </View>
        <LineChart
          data={{
            labels,
            datasets: [
              { data: chartCarbs, color: () => '#f5a623' },
              { data: chartFats,  color: () => '#50fa7b' },
            ],
          }}
          width={CHART_WIDTH}
          height={190}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(245, 166, 35, ${opacity})`,
          }}
          style={styles.chart}
          bezier
          fromZero
        />
      </View>

      {/* Workout Frequency Bar Chart */}
      <View style={styles.chartCard}>
        <SectionTitle>EXERCISES PER DAY</SectionTitle>
        <BarChart
          data={{ labels, datasets: [{ data: chartWorkouts }] }}
          width={CHART_WIDTH}
          height={170}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(80, 250, 123, ${opacity})`,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
        />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 16, paddingBottom: 40 },

  header: { marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSub: { color: '#555', fontSize: 13, marginTop: 2 },

  summaryGrid: { gap: 10, marginBottom: 16 },
  statSummary: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  statSummaryLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statSummaryVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statSummaryUnit: { fontSize: 14, fontWeight: '400', color: '#888' },
  statSummaryPct: { fontSize: 18, fontWeight: '800' },
  statSummaryGoal: { color: '#555', fontSize: 11, marginTop: 4 },

  workoutStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  workoutStatCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: '#e94560',
  },
  workoutStatVal: { fontSize: 28, fontWeight: '900', color: '#e94560' },
  workoutStatLabel: { color: '#888', fontSize: 12, marginTop: 4 },

  chartCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  goalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  goalDash: { width: 24, height: 2, backgroundColor: '#fff', opacity: 0.3 },
  goalLineLabel: { color: '#555', fontSize: 11 },

  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: '#888', fontSize: 12 },

  chart: { borderRadius: 8, marginLeft: -16 },
});