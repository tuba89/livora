---
name: task-manager
description: Organizes the user's daily to-do list, prioritizing tasks based on their work schedule and available free time.
---

# Task Manager Skill

When the user asks to add or manage a task:
1. Analyze the urgency and effort required for the task.
2. Check the user's `work_hours` from their profile to ensure you do not schedule heavy personal tasks during deep work blocks.
3. Use the `add_work_task` tool to insert the task into the database.
4. Provide a brief confirmation message in a professional, authoritative tone.
