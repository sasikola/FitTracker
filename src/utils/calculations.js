export const sumMacros = (entries = []) =>
  entries.reduce(
    (totals, item) => ({
      calories: totals.calories + (parseFloat(item.calories) || 0),
      protein: totals.protein + (parseFloat(item.protein) || 0),
      carbs: totals.carbs + (parseFloat(item.carbs) || 0),
      fats: totals.fats + (parseFloat(item.fats) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );