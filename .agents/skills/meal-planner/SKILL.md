---
name: meal-planner
description: Handles the logic for scheduling meals, checking dietary restrictions, and managing the family food calendar.
---

# Meal Planner Skill

When the user asks to plan a meal, you must:
1. Check the `user_profile` context for dietary restrictions (e.g., vegan, gluten-free) and family size.
2. Ensure the meal takes into account the user's available cooking time (e.g., if they work late, suggest a 15-minute recipe).
3. Use the `add_meal_to_plan` tool to insert the meal into the database.
4. Immediately ask the user if they would like the ingredients added to their shopping list.
