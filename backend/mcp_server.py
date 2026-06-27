from fastmcp import FastMCP
import datetime
import os
import requests
from supabase import create_client
from google import genai
from google.genai import types

mcp = FastMCP("LIVORA Life Intelligence MCP")

# Global Supabase Client (Fix 1)
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# ─── TOOL 1: Weather ──────────
@mcp.tool()
def get_weather(city: str) -> str:
    """Gets real weather for user's city"""
    try:
        res = requests.get(f"https://wttr.in/{city}?format=j1", timeout=5)
        data = res.json()
        temp = data['current_condition'][0]['temp_C']
        desc = data['current_condition'][0]['weatherDesc'][0]['value']
        return f"🌤️ {city}: {temp}°C, {desc}"
    except:
        return f"Weather unavailable for {city}"

# ─── TOOL 2: Current Info (Search Grounding via Gemini) ─────────────
@mcp.tool()
def get_current_info(query: str) -> str:
    """Fetches real-time current events, news, or facts using Google Search"""
    try:
        client = genai.Client()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Search the web for the latest info about: {query}. Summarize concisely.",
            config=types.GenerateContentConfig(tools=[{"google_search": {}}])
        )
        return response.text
    except:
        return "Current info unavailable."

# ─── TOOL 3: Save Memory ──────────────────────
@mcp.tool()
def save_user_memory(category: str, fact: str, user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Saves personal facts about user to database"""
    try:
        supabase.table("user_memory").insert({
            "user_id": user_id,
            "category": category,
            "fact": fact,
        }).execute()
        return f"✅ I have noted: {fact}"
    except Exception as e:
        return f"Memory save failed: {e}"

# ─── TOOL 4: Get User Memory ──────────────────
@mcp.tool()
def get_user_memory(user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Loads everything LIVORA knows about user"""
    try:
        data = supabase.table("user_memory").select("*").eq("user_id", user_id).execute()
        if not data.data: return "No memories yet"
        return "What I know about you:\n" + "\n".join([f"• [{m['category']}] {m['fact']}" for m in data.data])
    except:
        return "Memory unavailable"

# ─── TOOL 5: Get Today's Agenda ───────────────
@mcp.tool()
def get_todays_agenda(user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Gets all tasks and appointments for today"""
    try:
        tasks = supabase.table("tasks").select("*").eq("user_id", user_id).eq("status", "pending").execute()
        appointments = supabase.table("appointments").select("*").eq("user_id", user_id).execute()
        result = "📋 YOUR DAY:\n"
        if tasks.data:
            result += "Tasks:\n" + "\n".join([f"• {t['task_title']}" for t in tasks.data]) + "\n"
        if appointments.data:
            result += "Appointments:\n" + "\n".join([f"• {a['title']} on {a['appointment_date']}" for a in appointments.data])
        return result
    except:
        return "Agenda unavailable"

# ─── TOOL 6: Add Task ─────────────────────────
@mcp.tool()
def add_task(title: str, priority: str = "medium", user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Adds a new task for the user"""
    try:
        supabase.table("tasks").insert({
            "user_id": user_id,
            "task_title": title,
            "due_date": datetime.date.today().isoformat(),
            "status": "pending"
        }).execute()
        return f"✅ Task added: {title}"
    except:
        return "Could not save task"

# ─── TOOL 7: Add Appointment ──────────────────
@mcp.tool()
def add_appointment(title: str, date: str, user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Saves a family or work appointment"""
    try:
        supabase.table("appointments").insert({
            "user_id": user_id,
            "title": title,
            "appointment_date": date
        }).execute()
        return f"✅ Appointment saved: {title} on {date}"
    except:
        return "Could not save appointment"

# ─── TOOL 8: Meal Suggestion ──────────────────
@mcp.tool()
def suggest_meal(meal_type: str, available_time: int, user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Suggests meal based on preferences and time"""
    try:
        memories = supabase.table("user_memory").select("*").eq("user_id", user_id).execute()
        recent = supabase.table("meals").select("*").eq("user_id", user_id).limit(5).execute()
        preferences = [m['fact'] for m in memories.data] if memories.data else []
        recent_meals = [m['meal_name'] for m in recent.data] if recent.data else []
        
        return f"Meal Request:\nType: {meal_type}\nTime available: {available_time} minutes\nUser preferences: {preferences}\nRecent meals (avoid): {recent_meals}\nPlease suggest an appropriate meal."
    except:
        return f"Suggest a {meal_type} meal under {available_time} minutes"

# ─── TOOL 9: Add Shopping Item ────────────────
@mcp.tool()
def add_to_shopping_list(item: str, user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Adds missing ingredient to shopping list"""
    try:
        supabase.table("shopping_lists").insert({
            "user_id": user_id,
            "item_name": item
        }).execute()
        return f"✅ Added to shopping list: {item}"
    except:
        return "Could not add to shopping list"

# ─── TOOL 10: Get Shopping List ───────────────
@mcp.tool()
def get_shopping_list(user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Returns current shopping list"""
    try:
        data = supabase.table("shopping_lists").select("*").eq("user_id", user_id).execute()
        if not data.data: return "Shopping list is empty ✅"
        return "🛒 Shopping List:\n" + "\n".join([f"• {i['item_name']}" for i in data.data])
    except:
        return "Shopping list unavailable"

# ─── TOOL 11: Complete Task ───────────────────
@mcp.tool()
def complete_task(task_title: str, user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Marks a task as completed"""
    try:
        supabase.table("tasks").update({"status": "completed"}).eq("task_title", task_title).eq("user_id", user_id).execute()
        return f"✅ Task completed: {task_title} 🎉"
    except:
        return "Could not complete task"

# ─── TOOL 12: Mark Item Purchased ─────────────
@mcp.tool()
def mark_item_purchased(item_name: str, user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Removes purchased item from shopping list"""
    try:
        supabase.table("shopping_lists").delete().eq("item_name", item_name).eq("user_id", user_id).execute()
        return f"✅ {item_name} marked as purchased 🛒"
    except:
        return "Could not update shopping list"

# ─── TOOL 13: Save Meal History ───────────────
@mcp.tool()
def save_meal_to_history(meal_name: str, meal_type: str, user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Saves cooked meal to history"""
    try:
        supabase.table("meals").insert({
            "user_id": user_id,
            "meal_name": meal_name,
            "scheduled_for": datetime.date.today().isoformat()
        }).execute()
        return f"✅ Saved to meal history: {meal_name}"
    except:
        return "Could not save meal"

if __name__ == "__main__":
    mcp.run(transport='sse')
