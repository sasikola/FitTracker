import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveFoodLog = async (date, entries) => {
  try {
    await AsyncStorage.setItem(`food_${date}`, JSON.stringify(entries));
  } catch (e) {
    console.error('saveFoodLog error', e);
  }
};

export const loadFoodLog = async (date) => {
  try {
    const data = await AsyncStorage.getItem(`food_${date}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveWorkoutLog = async (date, entries) => {
  try {
    await AsyncStorage.setItem(`workout_${date}`, JSON.stringify(entries));
  } catch (e) {
    console.error('saveWorkoutLog error', e);
  }
};

export const loadWorkoutLog = async (date) => {
  try {
    const data = await AsyncStorage.getItem(`workout_${date}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};