---
name: shopping-list
description: Manages the user's grocery and household shopping needs.
---

# Shopping List Skill

When the user asks to add items to their shopping list:
1. Parse the requested items cleanly.
2. Group similar items if possible (e.g., "apples and bananas" -> "Fruits: apples, bananas").
3. Use the `add_to_shopping_list` tool to insert the items into the database.
4. Confirm exactly what was added.
