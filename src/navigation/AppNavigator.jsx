import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import FoodLogScreen from '../screens/FoodLogScreen';
import AddFoodScreen from '../screens/AddFoodScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import AddWorkoutScreen from '../screens/AddWorkoutScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ────────── Food Stack ──────────
function FoodStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#e94560',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="FoodLog"
        component={FoodLogScreen}
        options={({ navigation }) => ({
          title: 'Food Log',
          headerRight: () => (
            <Icon
              name="plus-circle"
              size={28}
              color="#e94560"
              style={{ marginRight: 12 }}
              onPress={() => navigation.navigate('AddFood')}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddFood"
        component={AddFoodScreen}
        options={{ title: 'Add Food' }}
      />
    </Stack.Navigator>
  );
}

// ─── Workout Stack ────────────────────────────────────────────
function WorkoutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#e94560',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="WorkoutLog"
        component={WorkoutScreen}
        options={({ navigation }) => ({
          title: 'Workout',
          headerRight: () => (
            <Icon
              name="plus-circle"
              size={28}
              color="#e94560"
              style={{ marginRight: 12 }}
              onPress={() => navigation.navigate('AddWorkout')}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddWorkout"
        component={AddWorkoutScreen}
        options={{ title: 'Add Workout' }}
      />
    </Stack.Navigator>
  );
}

// ─── Bottom Tabs ──────────────────────────────────────────────
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'view-dashboard',
            Food: 'food-apple',
            Workout: 'dumbbell',
            Progress: 'chart-line',
          };
          return (
            <Icon name={icons[route.name]} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#16213e',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Food" component={FoodStack} />
      <Tab.Screen name="Workout" component={WorkoutStack} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}