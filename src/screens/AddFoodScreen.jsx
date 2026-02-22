import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { loadFoodLog, saveFoodLog } from '../storage/storage';

const today = () => new Date().toISOString().split('T')[0];

// ─── Open Food Facts API ───────────────────────────────────────
// Free, no API key needed. Returns nutrition per 100g.
const searchFoods = async (query) => {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=20` +
    `&fields=product_name,brands,nutriments,serving_size,image_thumb_url`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'FitTracker/1.0' },
  });
  const data = await response.json();
  return data.products || [];
};

// Extract clean nutrition per 100g from Open Food Facts nutriments object
const extractNutrition = (nutriments = {}) => ({
  calories: parseFloat(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0),
  protein:  parseFloat(nutriments['proteins_100g']    ?? nutriments['proteins']    ?? 0),
  carbs:    parseFloat(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0),
  fats:     parseFloat(nutriments['fat_100g']          ?? nutriments['fat']          ?? 0),
});

// Scale per-100g values by quantity entered
const scaleNutrition = (per100g, grams) => {
  const factor = grams / 100;
  return {
    calories: parseFloat((per100g.calories * factor).toFixed(1)),
    protein:  parseFloat((per100g.protein  * factor).toFixed(1)),
    carbs:    parseFloat((per100g.carbs    * factor).toFixed(1)),
    fats:     parseFloat((per100g.fats     * factor).toFixed(1)),
  };
};

// ─── Sub-components ───────────────────────────────────────────

function MacroPreviewBar({ label, value, color }) {
  return (
    <View style={styles.macroPreviewItem}>
      <Text style={[styles.macroPreviewVal, { color }]}>{value}g</Text>
      <Text style={styles.macroPreviewLabel}>{label}</Text>
    </View>
  );
}

function SearchResultItem({ item, onSelect }) {
  const name  = item.product_name || 'Unknown Product';
  const brand = item.brands || '';
  const n100  = extractNutrition(item.nutriments);
  const hasData = n100.calories > 0 || n100.protein > 0;

  return (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => onSelect(item)}
      activeOpacity={0.75}
    >
      <View style={styles.resultLeft}>
        <Text style={styles.resultName} numberOfLines={1}>{name}</Text>
        {brand ? <Text style={styles.resultBrand} numberOfLines={1}>{brand}</Text> : null}
        {hasData ? (
          <Text style={styles.resultMacros}>
            <Text style={{ color: '#e94560' }}>P {n100.protein.toFixed(1)}g  </Text>
            <Text style={{ color: '#f5a623' }}>C {n100.carbs.toFixed(1)}g  </Text>
            <Text style={{ color: '#50fa7b' }}>F {n100.fats.toFixed(1)}g</Text>
            <Text style={{ color: '#888' }}>  per 100g</Text>
          </Text>
        ) : (
          <Text style={styles.noDataText}>Nutrition data unavailable</Text>
        )}
      </View>
      <View style={styles.resultRight}>
        <Text style={styles.resultCal}>{Math.round(n100.calories)}</Text>
        <Text style={styles.resultCalLabel}>kcal/100g</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function AddFoodScreen({ navigation }) {
  // Search state
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const searchTimeout               = useRef(null);

  // Selected food state
  const [selectedFood, setSelectedFood] = useState(null); // raw API item
  const [per100g, setPer100g]           = useState(null); // { calories, protein, carbs, fats }
  const [quantity, setQuantity]         = useState('100');

  // Manual entry fallback state
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCal, setManualCal]   = useState('');
  const [manualP, setManualP]       = useState('');
  const [manualC, setManualC]       = useState('');
  const [manualF, setManualF]       = useState('');

  // ── Search with debounce ──
  const handleQueryChange = (text) => {
    setQuery(text);
    setSelectedFood(null);
    setPer100g(null);
    setSearchDone(false);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 2) { setResults([]); return; }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const foods = await searchFoods(text.trim());
        // Filter out items with no product name
        setResults(foods.filter(f => f.product_name));
      } catch (e) {
        Alert.alert('Search Error', 'Could not reach the food database. Check your internet connection.');
        setResults([]);
      } finally {
        setSearching(false);
        setSearchDone(true);
      }
    }, 600); // 600ms debounce
  };

  // ── Select a food from results ──
  const handleSelect = (item) => {
    Keyboard.dismiss();
    const nutrition = extractNutrition(item.nutriments);
    setSelectedFood(item);
    setPer100g(nutrition);
    setResults([]);
    setQuery(item.product_name || '');
    setQuantity('100');
  };

  // ── Computed macros based on quantity ──
  const computedMacros = selectedFood && per100g
    ? scaleNutrition(per100g, parseFloat(quantity) || 0)
    : null;

  // ── Save entry ──
  const handleSave = async () => {
    if (manualMode) {
      if (!manualName.trim()) {
        Alert.alert('Missing Info', 'Please enter a food name.');
        return;
      }
      const entry = {
        name: manualName.trim(),
        calories: parseFloat(manualCal) || 0,
        protein:  parseFloat(manualP)   || 0,
        carbs:    parseFloat(manualC)   || 0,
        fats:     parseFloat(manualF)   || 0,
        quantity: null,
        source: 'manual',
        time: new Date().toISOString(),
      };
      const existing = await loadFoodLog(today());
      await saveFoodLog(today(), [...existing, entry]);
      navigation.goBack();
      return;
    }

    if (!selectedFood || !computedMacros) {
      Alert.alert('No Food Selected', 'Please search and select a food first, or use manual entry.');
      return;
    }
    const grams = parseFloat(quantity) || 0;
    if (grams <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity greater than 0.');
      return;
    }

    const entry = {
      name:     selectedFood.product_name,
      brand:    selectedFood.brands || '',
      quantity: grams,
      calories: computedMacros.calories,
      protein:  computedMacros.protein,
      carbs:    computedMacros.carbs,
      fats:     computedMacros.fats,
      per100g,
      source: 'openfoodfacts',
      time: new Date().toISOString(),
    };
    const existing = await loadFoodLog(today());
    await saveFoodLog(today(), [...existing, entry]);
    navigation.goBack();
  };

  const showResults = results.length > 0 && !selectedFood;
  const showEmpty   = searchDone && results.length === 0 && !selectedFood && !searching;

  // ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Toggle: Search vs Manual ── */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, !manualMode && styles.modeBtnActive]}
            onPress={() => setManualMode(false)}
          >
            <Text style={[styles.modeBtnText, !manualMode && styles.modeBtnTextActive]}>
              🔍 Search Food
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, manualMode && styles.modeBtnActive]}
            onPress={() => setManualMode(true)}
          >
            <Text style={[styles.modeBtnText, manualMode && styles.modeBtnTextActive]}>
              ✏️ Enter Manually
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════
            SEARCH MODE
        ══════════════════════════════════════════════════════ */}
        {!manualMode && (
          <>
            {/* Search Bar */}
            <View style={styles.searchWrap}>
              <Text style={styles.sectionTitle}>SEARCH FOOD DATABASE</Text>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={handleQueryChange}
                  placeholder="e.g. Chicken breast, Apple, Oats..."
                  placeholderTextColor="#444"
                  autoFocus={!selectedFood}
                  returnKeyType="search"
                />
                {searching && (
                  <ActivityIndicator size="small" color="#e94560" style={{ marginRight: 12 }} />
                )}
                {query.length > 0 && !searching && (
                  <TouchableOpacity onPress={() => {
                    setQuery(''); setResults([]);
                    setSelectedFood(null); setPer100g(null); setSearchDone(false);
                  }}>
                    <Text style={styles.clearBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.searchHint}>
                Powered by Open Food Facts · {'>'}2M products
              </Text>
            </View>

            {/* Search Results */}
            {showResults && (
              <View style={styles.resultsWrap}>
                <Text style={styles.sectionTitle}>RESULTS</Text>
                {results.map((item, i) => (
                  <SearchResultItem key={i} item={item} onSelect={handleSelect} />
                ))}
              </View>
            )}

            {/* Empty State */}
            {showEmpty && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🤷</Text>
                <Text style={styles.emptyTitle}>No results for "{query}"</Text>
                <Text style={styles.emptyHint}>Try a different spelling or use manual entry</Text>
              </View>
            )}

            {/* ── Selected Food Card ── */}
            {selectedFood && per100g && (
              <View style={styles.selectedCard}>
                {/* Food Info */}
                <View style={styles.selectedHeader}>
                  <View style={styles.selectedTick}>
                    <Text style={styles.selectedTickText}>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedName} numberOfLines={2}>
                      {selectedFood.product_name}
                    </Text>
                    {selectedFood.brands ? (
                      <Text style={styles.selectedBrand}>{selectedFood.brands}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => { setSelectedFood(null); setPer100g(null); setQuery(''); }}
                    style={styles.changeBtn}
                  >
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Per 100g stats */}
                <View style={styles.per100gRow}>
                  <Text style={styles.per100gLabel}>Per 100g:</Text>
                  <Text style={styles.per100gVal}>
                    {Math.round(per100g.calories)} kcal ·{' '}
                    <Text style={{ color: '#e94560' }}>P {per100g.protein.toFixed(1)}g</Text> ·{' '}
                    <Text style={{ color: '#f5a623' }}>C {per100g.carbs.toFixed(1)}g</Text> ·{' '}
                    <Text style={{ color: '#50fa7b' }}>F {per100g.fats.toFixed(1)}g</Text>
                  </Text>
                </View>

                {/* Quantity Input */}
                <View style={styles.quantitySection}>
                  <Text style={styles.sectionTitle}>YOUR SERVING (g)</Text>
                  <View style={styles.quantityRow}>
                    {/* Quick preset buttons */}
                    {['50', '100', '150', '200', '250'].map(q => (
                      <TouchableOpacity
                        key={q}
                        style={[styles.presetBtn, quantity === q && styles.presetBtnActive]}
                        onPress={() => setQuantity(q)}
                      >
                        <Text style={[styles.presetBtnText, quantity === q && styles.presetBtnTextActive]}>
                          {q}g
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.quantityInputWrap}>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor="#333"
                    />
                    <Text style={styles.quantityUnit}>grams</Text>
                  </View>
                </View>

                {/* Live Calculated Macros */}
                {computedMacros && parseFloat(quantity) > 0 && (
                  <View style={styles.calcCard}>
                    <Text style={styles.calcTitle}>
                      CALCULATED FOR {quantity}g
                    </Text>
                    <View style={styles.calcRow}>
                      <View style={styles.calcItem}>
                        <Text style={styles.calcVal}>{Math.round(computedMacros.calories)}</Text>
                        <Text style={styles.calcLabel}>kcal</Text>
                      </View>
                      <View style={[styles.calcItem, styles.calcDivider]}>
                        <Text style={[styles.calcVal, { color: '#e94560' }]}>{computedMacros.protein}g</Text>
                        <Text style={styles.calcLabel}>Protein</Text>
                      </View>
                      <View style={[styles.calcItem, styles.calcDivider]}>
                        <Text style={[styles.calcVal, { color: '#f5a623' }]}>{computedMacros.carbs}g</Text>
                        <Text style={styles.calcLabel}>Carbs</Text>
                      </View>
                      <View style={[styles.calcItem, styles.calcDivider]}>
                        <Text style={[styles.calcVal, { color: '#50fa7b' }]}>{computedMacros.fats}g</Text>
                        <Text style={styles.calcLabel}>Fats</Text>
                      </View>
                    </View>

                    {/* Macro Split Bar */}
                    <View style={styles.splitBarWrap}>
                      {[
                        { val: computedMacros.protein * 4, color: '#e94560' },
                        { val: computedMacros.carbs   * 4, color: '#f5a623' },
                        { val: computedMacros.fats    * 9, color: '#50fa7b' },
                      ].map((m, i) => {
                        const total = (computedMacros.protein * 4) + (computedMacros.carbs * 4) + (computedMacros.fats * 9);
                        const pct = total > 0 ? (m.val / total) * 100 : 0;
                        return (
                          <View key={i} style={[styles.splitSegment, { flex: pct || 1, backgroundColor: m.color }]} />
                        );
                      })}
                    </View>
                    <View style={styles.splitLegend}>
                      <Text style={[styles.splitLegendText, { color: '#e94560' }]}>
                        Protein {Math.round(computedMacros.protein * 4 / (computedMacros.calories || 1) * 100)}%
                      </Text>
                      <Text style={[styles.splitLegendText, { color: '#f5a623' }]}>
                        Carbs {Math.round(computedMacros.carbs * 4 / (computedMacros.calories || 1) * 100)}%
                      </Text>
                      <Text style={[styles.splitLegendText, { color: '#50fa7b' }]}>
                        Fats {Math.round(computedMacros.fats * 9 / (computedMacros.calories || 1) * 100)}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            MANUAL MODE
        ══════════════════════════════════════════════════════ */}
        {manualMode && (
          <View style={styles.manualWrap}>
            <Text style={styles.sectionTitle}>FOOD NAME</Text>
            <TextInput
              style={styles.manualNameInput}
              value={manualName}
              onChangeText={setManualName}
              placeholder="e.g. Homemade Dal"
              placeholderTextColor="#444"
              autoFocus
            />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>CALORIES</Text>
            <View style={styles.calCard}>
              <TextInput
                style={styles.calInput}
                value={manualCal}
                onChangeText={setManualCal}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#333"
              />
              <Text style={styles.calUnit}>kcal</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>MACROS</Text>
            <View style={styles.macroRow}>
              {[
                { label: 'Protein', val: manualP, set: setManualP, color: '#e94560' },
                { label: 'Carbs',   val: manualC, set: setManualC, color: '#f5a623' },
                { label: 'Fats',    val: manualF, set: setManualF, color: '#50fa7b' },
              ].map(m => (
                <View key={m.label} style={[styles.macroField, { borderTopColor: m.color }]}>
                  <Text style={[styles.macroFieldLabel, { color: m.color }]}>{m.label}</Text>
                  <TextInput
                    style={styles.macroFieldInput}
                    value={m.val}
                    onChangeText={m.set}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#333"
                  />
                  <Text style={styles.macroFieldUnit}>g</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Add to Log Button ── */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!manualMode && !selectedFood) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>ADD TO LOG</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 16, paddingBottom: 50 },

  sectionTitle: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  modeBtnActive: { backgroundColor: '#e94560' },
  modeBtnText: { color: '#888', fontWeight: '700', fontSize: 13 },
  modeBtnTextActive: { color: '#fff' },

  // Search
  searchWrap: { marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#e94560',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  clearBtn: { color: '#555', fontSize: 16, paddingHorizontal: 12 },
  searchHint: { color: '#333', fontSize: 11, marginTop: 6, textAlign: 'right' },

  // Results
  resultsWrap: { marginBottom: 16 },
  resultCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultLeft: { flex: 1, marginRight: 10 },
  resultName: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  resultBrand: { color: '#555', fontSize: 12, marginBottom: 4 },
  resultMacros: { fontSize: 12 },
  noDataText: { color: '#444', fontSize: 12, fontStyle: 'italic' },
  resultRight: { alignItems: 'flex-end' },
  resultCal: { color: '#e94560', fontSize: 20, fontWeight: '900' },
  resultCalLabel: { color: '#555', fontSize: 11 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyHint: { color: '#555', fontSize: 13, textAlign: 'center' },

  // Selected Food Card
  selectedCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e94560',
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  selectedTick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTickText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  selectedName: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  selectedBrand: { color: '#555', fontSize: 12 },
  changeBtn: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  changeBtnText: { color: '#e94560', fontSize: 12, fontWeight: '700' },

  per100gRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  per100gLabel: { color: '#888', fontSize: 12, fontWeight: '600' },
  per100gVal: { color: '#ccc', fontSize: 12, flex: 1 },

  // Quantity
  quantitySection: { marginBottom: 16 },
  quantityRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  presetBtn: {
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  presetBtnActive: { borderColor: '#e94560', backgroundColor: '#e9456022' },
  presetBtnText: { color: '#666', fontSize: 13, fontWeight: '700' },
  presetBtnTextActive: { color: '#e94560' },
  quantityInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  quantityInput: {
    flex: 1,
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    paddingVertical: 12,
  },
  quantityUnit: { color: '#555', fontSize: 16 },

  // Calculated macros card
  calcCard: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 14,
  },
  calcTitle: {
    color: '#e94560',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  calcRow: { flexDirection: 'row', marginBottom: 12 },
  calcItem: { flex: 1, alignItems: 'center' },
  calcDivider: { borderLeftWidth: 1, borderLeftColor: '#1a1a2e' },
  calcVal: { color: '#fff', fontSize: 20, fontWeight: '900' },
  calcLabel: { color: '#888', fontSize: 11, marginTop: 2 },

  splitBarWrap: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  splitSegment: { height: 6 },
  splitLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  splitLegendText: { fontSize: 11, fontWeight: '700' },

  // Manual Mode
  manualWrap: { marginBottom: 16 },
  manualNameInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  calCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e94560',
  },
  calInput: {
    flex: 1,
    color: '#fff',
    fontSize: 38,
    fontWeight: '900',
    paddingVertical: 12,
  },
  calUnit: { color: '#555', fontSize: 16 },
  macroRow: { flexDirection: 'row', gap: 10 },
  macroField: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    borderTopWidth: 3,
    alignItems: 'center',
  },
  macroFieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  macroFieldInput: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },
  macroFieldUnit: { color: '#555', fontSize: 12 },

  // Save Button
  saveBtn: {
    backgroundColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { backgroundColor: '#333', opacity: 0.6 },
  saveBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2,
  },
});