import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { loadWorkoutLog, saveWorkoutLog } from '../storage/storage';

const today = () => new Date().toISOString().split('T')[0];

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

const MUSCLE_COLORS = {
  Chest: '#e94560', Back: '#f5a623', Legs: '#50fa7b', Shoulders: '#8be9fd',
  Arms: '#bd93f9', Core: '#ffb86c', Cardio: '#ff79c6', Other: '#888',
};

const QUICK_EXERCISES = {
  Chest: ['Bench Press', 'Push Ups', 'Incline Bench', 'Chest Fly', 'Dips'],
  Back: ['Pull Ups', 'Deadlift', 'Bent Row', 'Lat Pulldown', 'Cable Row'],
  Legs: ['Squat', 'Leg Press', 'Lunges', 'Leg Curl', 'Calf Raise'],
  Shoulders: ['OHP', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Shrugs'],
  Arms: ['Bicep Curl', 'Tricep Ext', 'Hammer Curl', 'Skull Crusher', 'Dip'],
  Core: ['Plank', 'Crunches', 'Leg Raise', 'Russian Twist', 'Ab Wheel'],
  Cardio: ['Running', 'Cycling', 'Jump Rope', 'Swimming', 'Rowing'],
  Other: [],
};

function SetRow({ index, sets, reps, weight, onUpdate }) {
  return (
    <View style={styles.setRow}>
      <View style={styles.setNumWrap}>
        <Text style={styles.setNum}>{index + 1}</Text>
      </View>
      <TextInput
        style={styles.setInput}
        value={String(reps)}
        onChangeText={(v) => onUpdate(index, 'reps', v)}
        keyboardType="numeric"
        placeholder="Reps"
        placeholderTextColor="#333"
      />
      <Text style={styles.setX}>×</Text>
      <TextInput
        style={styles.setInput}
        value={String(weight)}
        onChangeText={(v) => onUpdate(index, 'weight', v)}
        keyboardType="numeric"
        placeholder="kg"
        placeholderTextColor="#333"
      />
      <Text style={styles.setKg}>kg</Text>
    </View>
  );
}

export default function AddWorkoutScreen({ navigation }) {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [sets, setSets] = useState([{ reps: '10', weight: '0' }]);
  const [notes, setNotes] = useState('');

  const color = MUSCLE_COLORS[muscle] || '#e94560';

  const updateSet = (index, field, value) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSet = () => setSets(prev => [...prev, { reps: prev[prev.length - 1].reps, weight: prev[prev.length - 1].weight }]);
  const removeSet = () => {
    if (sets.length > 1) setSets(prev => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Info', 'Please enter an exercise name.');
      return;
    }
    const totalSets = sets.length;
    const avgReps = sets[0].reps;
    const avgWeight = sets[0].weight;

    const entry = {
      name: name.trim(),
      muscle,
      sets: totalSets,
      reps: parseInt(avgReps) || 0,
      weight: parseFloat(avgWeight) || 0,
      setDetails: sets,
      notes: notes.trim(),
      time: new Date().toISOString(),
    };

    const existing = await loadWorkoutLog(today());
    await saveWorkoutLog(today(), [...existing, entry]);
    navigation.goBack();
  };

  const quickExercises = QUICK_EXERCISES[muscle] || [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Exercise Name */}
        <Text style={styles.sectionTitle}>EXERCISE NAME</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bench Press"
          placeholderTextColor="#444"
          autoFocus
        />

        {/* Muscle Group */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>MUSCLE GROUP</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleRow}>
          {MUSCLE_GROUPS.map(m => {
            const selected = muscle === m;
            const c = MUSCLE_COLORS[m];
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.muscleChip,
                  selected && { backgroundColor: c, borderColor: c },
                  !selected && { borderColor: '#333' },
                ]}
                onPress={() => setMuscle(m)}
              >
                <Text style={[styles.muscleChipText, selected && { color: '#fff' }]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Quick Exercises for selected muscle */}
        {quickExercises.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
            {quickExercises.map((ex, i) => (
              <TouchableOpacity key={i} style={styles.quickChip} onPress={() => setName(ex)}>
                <Text style={[styles.quickChipText, { color }]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Sets */}
        <View style={styles.setsHeader}>
          <Text style={styles.sectionTitle}>SETS</Text>
          <View style={styles.setsControls}>
            <TouchableOpacity style={styles.setCtrlBtn} onPress={removeSet}>
              <Text style={styles.setCtrlText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.setCount}>{sets.length}</Text>
            <TouchableOpacity style={[styles.setCtrlBtn, { backgroundColor: color }]} onPress={addSet}>
              <Text style={styles.setCtrlText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.setsWrap}>
          <View style={styles.setHeaderRow}>
            <Text style={styles.setHeaderLabel}>SET</Text>
            <Text style={styles.setHeaderLabel}>REPS</Text>
            <Text style={[styles.setHeaderLabel, { marginLeft: 18 }]}> </Text>
            <Text style={styles.setHeaderLabel}>WEIGHT</Text>
          </View>
          {sets.map((s, i) => (
            <SetRow
              key={i}
              index={i}
              reps={s.reps}
              weight={s.weight}
              onUpdate={updateSet}
            />
          ))}
        </View>

        {/* Volume Preview */}
        {sets.length > 0 && (
          <View style={[styles.volCard, { borderColor: color }]}>
            <Text style={styles.volLabel}>TOTAL VOLUME</Text>
            <Text style={[styles.volVal, { color }]}>
              {sets.reduce((sum, s) => sum + ((parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0)), 0).toFixed(1)} kg
            </Text>
          </View>
        )}

        {/* Notes */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>NOTES (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. felt strong today, increased weight"
          placeholderTextColor="#444"
          multiline
          numberOfLines={3}
        />

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: color }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>LOG EXERCISE</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 16, paddingBottom: 40 },

  sectionTitle: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },

  nameInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  muscleRow: { marginBottom: 12 },
  muscleChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  muscleChipText: { color: '#888', fontWeight: '700', fontSize: 13 },

  quickRow: { marginBottom: 16 },
  quickChip: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickChipText: { fontWeight: '700', fontSize: 13 },

  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  setsControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  setCtrlBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCtrlText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  setCount: { color: '#fff', fontSize: 16, fontWeight: '800', minWidth: 20, textAlign: 'center' },

  setsWrap: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 12, marginBottom: 16 },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  setHeaderLabel: { flex: 1, color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNumWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNum: { color: '#8be9fd', fontSize: 13, fontWeight: '800' },
  setInput: {
    flex: 1,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  setX: { color: '#555', fontSize: 16, fontWeight: '700' },
  setKg: { color: '#555', fontSize: 13 },

  volCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volLabel: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  volVal: { fontSize: 22, fontWeight: '900' },

  notesInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
    textAlignVertical: 'top',
  },

  saveBtn: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
});