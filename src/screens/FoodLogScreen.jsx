import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadFoodLog, saveFoodLog } from '../storage/storage';
import { sumMacros } from '../utils/calculations';
import { DAILY_GOALS } from '../constants/macros';

const today = () => new Date().toISOString().split('T')[0];
const SCREEN_WIDTH = Dimensions.get('window').width;
const ACTION_WIDTH = 140; // total width of delete+edit buttons revealed on swipe

// ─── MacroChip ────────────────────────────────────────────────
function MacroChip({ label, value, color }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.chipVal, { color }]}>{Math.round(value)}g</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────
function SummaryBar({ totals }) {
  const calPct = Math.min((totals.calories / DAILY_GOALS.calories) * 100, 100);
  const over = totals.calories > DAILY_GOALS.calories;
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View>
          <Text style={styles.summaryTitle}>TODAY</Text>
          <Text style={[styles.summaryCalories, over && { color: '#ff6b6b' }]}>
            {Math.round(totals.calories)}{' '}
            <Text style={styles.summaryGoal}>
              / {DAILY_GOALS.calories} kcal
            </Text>
          </Text>
        </View>
        <View style={styles.summaryChips}>
          <MacroChip label="P" value={totals.protein} color="#e94560" />
          <MacroChip label="C" value={totals.carbs} color="#f5a623" />
          <MacroChip label="F" value={totals.fats} color="#50fa7b" />
        </View>
      </View>
      <View style={styles.calBarBg}>
        <View
          style={[
            styles.calBarFill,
            {
              width: `${calPct}%`,
              backgroundColor: over ? '#ff6b6b' : '#e94560',
            },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────
function EditModal({ visible, item, onSave, onClose }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  // Populate fields when modal opens
  React.useEffect(() => {
    if (item) {
      setName(item.name ?? '');
      setCalories(String(item.calories ?? ''));
      setProtein(String(item.protein ?? ''));
      setCarbs(String(item.carbs ?? ''));
      setFats(String(item.fats ?? ''));
    }
  }, [item]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Info', 'Food name cannot be empty.');
      return;
    }
    onSave({
      ...item,
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fats: parseFloat(fats) || 0,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>EDIT FOOD</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.modalLabel}>FOOD NAME</Text>
            <TextInput
              style={styles.modalTextInput}
              value={name}
              onChangeText={setName}
              placeholder="Food name"
              placeholderTextColor="#444"
            />

            {/* Calories */}
            <Text style={[styles.modalLabel, { marginTop: 16 }]}>CALORIES</Text>
            <View style={styles.modalCalRow}>
              <TextInput
                style={styles.modalCalInput}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#333"
              />
              <Text style={styles.modalCalUnit}>kcal</Text>
            </View>

            {/* Macros */}
            <Text style={[styles.modalLabel, { marginTop: 16 }]}>MACROS</Text>
            <View style={styles.modalMacroRow}>
              {[
                {
                  label: 'Protein',
                  val: protein,
                  set: setProtein,
                  color: '#e94560',
                },
                { label: 'Carbs', val: carbs, set: setCarbs, color: '#f5a623' },
                { label: 'Fats', val: fats, set: setFats, color: '#50fa7b' },
              ].map(m => (
                <View
                  key={m.label}
                  style={[styles.modalMacroField, { borderTopColor: m.color }]}
                >
                  <Text style={[styles.modalMacroLabel, { color: m.color }]}>
                    {m.label}
                  </Text>
                  <TextInput
                    style={styles.modalMacroInput}
                    value={m.val}
                    onChangeText={m.set}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#333"
                  />
                  <Text style={styles.modalMacroUnit}>g</Text>
                </View>
              ))}
            </View>

            {/* Live preview */}
            <View style={styles.modalPreview}>
              <View style={styles.modalPreviewItem}>
                <Text style={styles.modalPreviewVal}>
                  {Math.round(parseFloat(calories) || 0)}
                </Text>
                <Text style={styles.modalPreviewLabel}>kcal</Text>
              </View>
              <View
                style={[styles.modalPreviewItem, styles.modalPreviewDivider]}
              >
                <Text style={[styles.modalPreviewVal, { color: '#e94560' }]}>
                  {parseFloat(protein) || 0}g
                </Text>
                <Text style={styles.modalPreviewLabel}>Protein</Text>
              </View>
              <View
                style={[styles.modalPreviewItem, styles.modalPreviewDivider]}
              >
                <Text style={[styles.modalPreviewVal, { color: '#f5a623' }]}>
                  {parseFloat(carbs) || 0}g
                </Text>
                <Text style={styles.modalPreviewLabel}>Carbs</Text>
              </View>
              <View
                style={[styles.modalPreviewItem, styles.modalPreviewDivider]}
              >
                <Text style={[styles.modalPreviewVal, { color: '#50fa7b' }]}>
                  {parseFloat(fats) || 0}g
                </Text>
                <Text style={styles.modalPreviewLabel}>Fats</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSave}
              >
                <Text style={styles.modalSaveText}>SAVE CHANGES</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Swipeable Food Row ───────────────────────────────────────
function SwipeableFoodItem({ item, onDelete, onEdit }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dy) < Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        const newX = isOpen.current ? g.dx - ACTION_WIDTH : g.dx;
        const clamped = Math.min(0, Math.max(-ACTION_WIDTH, newX));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        const threshold = ACTION_WIDTH / 2;
        if (g.dx < -threshold || (isOpen.current && g.dx < threshold)) {
          // snap open
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
          }).start(() => {
            isOpen.current = true;
          });
        } else {
          // snap closed
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => {
            isOpen.current = false;
          });
        }
      },
    }),
  ).current;

  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    isOpen.current = false;
  };

  const timeLabel = item.time
    ? new Date(item.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Macro split bar
  const proteinCal = (item.protein || 0) * 4;
  const carbsCal = (item.carbs || 0) * 4;
  const fatsCal = (item.fats || 0) * 9;
  const totalCal = proteinCal + carbsCal + fatsCal || 1;

  return (
    <View style={styles.swipeContainer}>
      {/* Action buttons (behind the card) */}
      <View style={styles.actionsWrap}>
        <TouchableOpacity
          style={styles.editAction}
          onPress={() => {
            close();
            setTimeout(() => onEdit(), 200);
          }}
        >
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            close();
            setTimeout(() => onDelete(), 200);
          }}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Food card (slides left to reveal actions) */}
      <Animated.View
        style={[styles.entryCard, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Left: icon + info */}
        <View style={styles.entryLeft}>
          <View style={styles.iconWrap}>
            <Text style={styles.entryIcon}>🍽️</Text>
          </View>
          <View style={styles.entryInfo}>
            <View style={styles.entryTopRow}>
              <Text style={styles.entryName} numberOfLines={1}>
                {item.name}
              </Text>
              {timeLabel ? (
                <Text style={styles.entryTime}>{timeLabel}</Text>
              ) : null}
            </View>
            {item.quantity ? (
              <Text style={styles.entryQuantity}>{item.quantity}g serving</Text>
            ) : null}
            <Text style={styles.entryMacros}>
              <Text style={{ color: '#e94560' }}>P {item.protein || 0}g </Text>
              <Text style={{ color: '#f5a623' }}>C {item.carbs || 0}g </Text>
              <Text style={{ color: '#50fa7b' }}>F {item.fats || 0}g</Text>
            </Text>
            {/* Mini split bar */}
            <View style={styles.splitBar}>
              <View
                style={[
                  styles.splitSeg,
                  { flex: proteinCal / totalCal, backgroundColor: '#e94560' },
                ]}
              />
              <View
                style={[
                  styles.splitSeg,
                  { flex: carbsCal / totalCal, backgroundColor: '#f5a623' },
                ]}
              />
              <View
                style={[
                  styles.splitSeg,
                  { flex: fatsCal / totalCal, backgroundColor: '#50fa7b' },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Right: calories */}
        <View style={styles.entryRight}>
          <Text style={styles.entryCal}>{Math.round(item.calories || 0)}</Text>
          <Text style={styles.entryCalLabel}>kcal</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function FoodLogScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [editItem, setEditItem] = useState(null); // item being edited
  const [editIndex, setEditIndex] = useState(null); // index of item
  const [editVisible, setEditVisible] = useState(false);

  const totals = sumMacros(entries);

  useFocusEffect(
    useCallback(() => {
      loadFoodLog(today()).then(setEntries);
    }, []),
  );

  // ── Delete ──
  const deleteEntry = index => {
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

  // ── Open Edit Modal ──
  const openEdit = (item, index) => {
    setEditItem(item);
    setEditIndex(index);
    setEditVisible(true);
  };

  // ── Save Edit ──
  const saveEdit = async updatedItem => {
    const updated = entries.map((e, i) => (i === editIndex ? updatedItem : e));
    setEntries(updated);
    await saveFoodLog(today(), updated);
    setEditVisible(false);
    setEditItem(null);
    setEditIndex(null);
  };

  const renderItem = ({ item, index }) => (
    <SwipeableFoodItem
      item={item}
      onDelete={() => deleteEntry(index)}
      onEdit={() => openEdit(item, index)}
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
            <Text style={styles.emptyHint}>
              Tap + in the top right to add your first meal
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <Text style={styles.swipeHint}>
        ← Swipe left on an entry to edit or delete
      </Text>

      {/* Edit Modal */}
      <EditModal
        visible={editVisible}
        item={editItem}
        onSave={saveEdit}
        onClose={() => setEditVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  list: { padding: 16, paddingBottom: 48 },

  // Summary
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

  // Swipeable row
  swipeContainer: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionsWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
  },
  editAction: {
    flex: 1,
    backgroundColor: '#f5a623',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteAction: {
    flex: 1,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Food card
  entryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryIcon: { fontSize: 20 },
  entryInfo: { flex: 1 },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    marginRight: 6,
  },
  entryTime: { color: '#555', fontSize: 11 },
  entryQuantity: { color: '#666', fontSize: 11, marginBottom: 2 },
  entryMacros: { fontSize: 12, marginBottom: 5 },
  splitBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#0f3460',
  },
  splitSeg: { height: 4 },
  entryRight: { alignItems: 'flex-end', marginLeft: 8 },
  entryCal: { color: '#e94560', fontSize: 22, fontWeight: '900' },
  entryCalLabel: { color: '#555', fontSize: 11 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyHint: { color: '#555', fontSize: 14, textAlign: 'center' },

  swipeHint: {
    textAlign: 'center',
    color: '#333',
    fontSize: 11,
    paddingBottom: 8,
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#e94560',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { color: '#fff', fontWeight: '700' },

  modalLabel: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },

  modalTextInput: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e94560',
  },
  modalCalInput: {
    flex: 1,
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    paddingVertical: 10,
  },
  modalCalUnit: { color: '#555', fontSize: 16 },

  modalMacroRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modalMacroField: {
    flex: 1,
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 12,
    borderTopWidth: 3,
    alignItems: 'center',
  },
  modalMacroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalMacroInput: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },
  modalMacroUnit: { color: '#555', fontSize: 12 },

  modalPreview: {
    flexDirection: 'row',
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  modalPreviewItem: { flex: 1, alignItems: 'center' },
  modalPreviewDivider: { borderLeftWidth: 1, borderLeftColor: '#1a1a2e' },
  modalPreviewVal: { color: '#fff', fontSize: 17, fontWeight: '900' },
  modalPreviewLabel: { color: '#555', fontSize: 11, marginTop: 2 },

  modalBtnRow: { flexDirection: 'row', gap: 10, paddingBottom: 10 },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    backgroundColor: '#0f3460',
    alignItems: 'center',
  },
  modalCancelText: { color: '#888', fontWeight: '700', fontSize: 14 },
  modalSaveBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 15,
    backgroundColor: '#e94560',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});
