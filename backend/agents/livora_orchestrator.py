# Copyright (c) 2026 MyCompany LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from google.genai import types
import json
import requests

load_dotenv()

# Initialize Supabase
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Initialize Gemini
client = genai.Client()

# Fake user ID for demo purposes
USER_ID = "00000000-0000-0000-0000-000000000000"

# ==========================================
# J.A.R.V.I.S. MEMORY SYSTEM
# ==========================================
def fetch_user_profile() -> str:
    """Fetches all permanent memory facts for the user."""
    try:
        response = supabase.table("user_memory").select("category, fact").eq("user_id", USER_ID).execute()
        facts = response.data
        if not facts:
            return "No prior memory about this user."
        
        profile = "KNOWN FACTS ABOUT THE USER:\n"
        for item in facts:
            profile += f"- [{item['category']}] {item['fact']}\n"
        return profile
    except Exception as e:
        return ""

def save_memory(category: str, fact: str) -> str:
    """Saves a new fact about the user (e.g., preferences, family, work hours) into their permanent memory."""
    try:
        supabase.table("user_memory").insert({
            "user_id": USER_ID,
            "category": category,
            "fact": fact
        }).execute()
        return f"Successfully saved memory: [{category}] {fact}"
    except Exception as e:
        return f"Error saving memory: {str(e)}"

# ==========================================
# HOME AGENT TOOLS (Meals & Shopping)
# ==========================================
def add_meal_to_plan(meal_name: str, ingredients: list[str], scheduled_for: str) -> str:
    """Schedules a meal and its ingredients into the database."""
    try:
        data = {
            "user_id": USER_ID,
            "meal_name": meal_name,
            "ingredients": ", ".join(ingredients),
            "scheduled_for": scheduled_for
        }
        supabase.table("meals").insert(data).execute()
        return f"Successfully added {meal_name} to the meal plan for {scheduled_for}."
    except Exception as e:
        return f"Error adding meal: {str(e)}"

def add_to_shopping_list(item_names: list[str]) -> str:
    """Adds a list of items to the user's shopping list."""
    try:
        for item in item_names:
            supabase.table("shopping_lists").insert({
                "user_id": USER_ID,
                "item_name": item
            }).execute()
        return f"Successfully added {len(item_names)} items to the shopping list."
    except Exception as e:
        return f"Error adding to shopping list: {str(e)}"

# ==========================================
# WORK & FAMILY AGENT TOOLS
# ==========================================
def add_work_task(task_title: str, due_date: str) -> str:
    """Adds a task to the user's work/daily to-do list."""
    try:
        supabase.table("tasks").insert({
            "user_id": USER_ID,
            "task_title": task_title,
            "due_date": due_date,
            "status": "pending"
        }).execute()
        return f"Successfully added task: {task_title}"
    except Exception as e:
        return f"Error adding task: {str(e)}"

def add_family_appointment(title: str, appointment_date: str) -> str:
    """Adds a family appointment or calendar event."""
    try:
        supabase.table("appointments").insert({
            "user_id": USER_ID,
            "title": title,
            "appointment_date": appointment_date
        }).execute()
        return f"Successfully scheduled {title} for {appointment_date}"
    except Exception as e:
        return f"Error adding appointment: {str(e)}"

# ==========================================
# EXTERNAL API TOOLS (Phase 4)
# ==========================================
def get_live_weather(city: str) -> str:
    """Gets the current weather for a specific city."""
    if not city: return "Unknown city."
    try:
        response = requests.get(f"https://wttr.in/{city}?format=j1", timeout=5)
        data = response.json()
        temp = data['current_condition'][0]['temp_C']
        desc = data['current_condition'][0]['weatherDesc'][0]['value']
        return f"Weather in {city}: {temp}°C, {desc}"
    except Exception as e:
        return f"Could not fetch weather for {city}."

def get_personalized_news(interests: str) -> str:
    """Gets top news headlines based on user interests."""
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key: return "News API key not configured."
    query = interests if interests else "general"
    try:
        response = requests.get(f"https://newsapi.org/v2/top-headlines?q={query}&apiKey={api_key}&pageSize=3", timeout=5)
        data = response.json()
        headlines = [article['title'] for article in data.get('articles', [])]
        if not headlines:
            response = requests.get(f"https://newsapi.org/v2/top-headlines?country=us&apiKey={api_key}&pageSize=3", timeout=5)
            headlines = [article['title'] for article in response.json().get('articles', [])]
        return "Top News:\n" + "\n".join(f"- {h}" for h in headlines)
    except Exception as e:
        return "Could not fetch news."

def update_user_city(city: str) -> str:
    """Updates the user's city in their profile."""
    try:
        existing = supabase.table("user_profile").select("*").eq("user_id", USER_ID).execute()
        if not existing.data:
            supabase.table("user_profile").insert({"user_id": USER_ID, "city": city}).execute()
        else:
            supabase.table("user_profile").update({"city": city}).eq("user_id", USER_ID).execute()
        return f"Successfully updated city to {city}."
    except Exception as e:
        return f"Error updating city: {str(e)}"

# ==========================================
# AGENTS
# ==========================================
def run_agent(agent_name: str, prompt: str, tools: list, role_description: str) -> str:
    """Generic function to run an agent with J.A.R.V.I.S. memory injected."""
    user_profile = fetch_user_profile()
    
    full_instruction = f"""
    {role_description}
    
    {user_profile}
    
    Always use the provided facts about the user to tailor your responses.
    """
    
    chat = client.chats.create(
        model="gemini-3.5-flash",
        config=types.GenerateContentConfig(
            tools=tools,
            system_instruction=full_instruction
        )
    )
    return chat.send_message(prompt).text

def generate_morning_briefing() -> str:
    """Generates the automatic morning briefing based on the user's profile."""
    try:
        # Get user profile
        profile_res = supabase.table("user_profile").select("*").eq("user_id", USER_ID).execute()
        profile = profile_res.data[0] if profile_res.data else {}
        city = profile.get("city", "London") # Fallback to London if not set
        interests = profile.get("interests", "technology, science")
        
        # Get tasks for today
        tasks_res = supabase.table("tasks").select("*").eq("user_id", USER_ID).eq("status", "pending").execute()
        tasks = tasks_res.data
        
        prompt = f"""
        Generate a beautiful, premium morning briefing for the user.
        Format it perfectly using markdown headers (##), emojis, and bullet points.
        
        Data available:
        - City: {city}
        - Interests: {interests}
        - Tasks to do: {len(tasks)} tasks
        
        Use the get_live_weather and get_personalized_news tools to get real data for their city and interests, then compile the final briefing.
        Make it sound like J.A.R.V.I.S speaking. Be concise, authoritative, but warm.
        """
        
        chat = client.chats.create(
            model="gemini-3.5-flash",
            config=types.GenerateContentConfig(
                tools=[get_live_weather, get_personalized_news],
                system_instruction="You are LIVORA generating the daily morning briefing."
            )
        )
        briefing = chat.send_message(prompt).text
        
        # Save briefing history
        supabase.table("daily_briefing").insert({
            "user_id": USER_ID,
            "briefing_text": briefing
        }).execute()
        
        return briefing
    except Exception as e:
        return f"Good morning! I tried to generate your briefing but encountered an error: {str(e)}"

def process_chat(user_input: str) -> str:
    """
    The Main LIVORA Orchestrator routes the user input to the correct sub-agent.
    """
    if user_input.strip() == "__TRIGGER_MORNING_BRIEFING__":
        return generate_morning_briefing()
        
    if user_input.strip().startswith("__UPDATE_CITY__"):
        city = user_input.replace("__UPDATE_CITY__", "").strip()
        update_user_city(city)
        return "City silently updated."

    route_prompt = f"""
    Analyze the user's input and determine which agent should handle it.
    Input: "{user_input}"
    
    Agents available:
    - HOME: For meals, cooking, recipes, and shopping lists.
    - WORK: For tasks, deadlines, to-do lists, and reminders.
    - FAMILY: For calendar, appointments, and family events.
    - GENERAL: For general greetings, chatting, OR IF THE USER IS TELLING YOU A FACT ABOUT THEMSELVES to remember.
    
    Reply ONLY with the exact word: HOME, WORK, FAMILY, or GENERAL.
    """
    
    routing_decision = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=route_prompt
    ).text.strip().upper()
    
    if "HOME" in routing_decision:
        return run_agent(
            "HOME", 
            user_input, 
            [add_meal_to_plan, add_to_shopping_list], 
            "You are the LIVORA Home Agent. You help the user plan meals and manage their shopping list. Be brief, warm, and helpful."
        )
    elif "WORK" in routing_decision:
        return run_agent(
            "WORK", 
            user_input, 
            [add_work_task], 
            "You are the LIVORA Work Agent. You help the user manage tasks and deadlines. Be brief, professional, and efficient."
        )
    elif "FAMILY" in routing_decision:
        return run_agent(
            "FAMILY", 
            user_input, 
            [add_family_appointment], 
            "You are the LIVORA Family Agent. You help manage appointments and family schedules. Be brief, caring, and organized."
        )
    else:
        # General/Memory Agent
        return run_agent(
            "GENERAL", 
            user_input, 
            [save_memory, get_live_weather, get_personalized_news, update_user_city], 
            "You are LIVORA, a premium AI Life Orchestration System (like J.A.R.V.I.S.). If the user tells you a fact about themselves, their family, or their preferences, ALWAYS use the save_memory tool to remember it. You can also fetch weather and news, or update their city if they tell you where they live. Be warm, brief, and helpful."
        )
