# Copyright (c) 2026 Assia Benkedia
# LIVORA - AI Life Intelligence System
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
import datetime

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
def get_current_info(query: str) -> str:
    """Uses Google Search Grounding to find current news, events, or facts."""
    try:
        # Isolated call to avoid 400 Invalid Argument when mixed with functions
        genai_client = genai.Client()
        response = genai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Search the web for the latest info about: {query}. Summarize concisely.",
            config=types.GenerateContentConfig(tools=[{"google_search": {}}])
        )
        return response.text
    except Exception as e:
        return f"Current info unavailable: {str(e)}"

def get_todays_agenda() -> str:
    """Gets tasks and appointments for today"""
    try:
        today = datetime.date.today().isoformat()
        tasks = supabase.table("tasks").select("*").eq("user_id", USER_ID).eq("status", "pending").execute()
        appointments = supabase.table("appointments").select("*").eq("user_id", USER_ID).gte("appointment_date", today).execute()
        
        result = "📋 YOUR AGENDA:\n"
        if tasks.data:
            result += "\n📌 Tasks:\n"
            for t in tasks.data: result += f"• {t['task_title']}\n"
        else:
            result += "\n✅ No pending tasks!\n"
            
        if appointments.data:
            result += "\n📅 Appointments:\n"
            for a in appointments.data: result += f"• {a['title']} on {a['appointment_date']}\n"
        return result
    except Exception as e:
        return f"Agenda error: {str(e)}"

def complete_task(task_title: str) -> str:
    """Marks a task as completed"""
    try:
        supabase.table("tasks").update({"status": "completed"}).eq("task_title", task_title).eq("user_id", USER_ID).execute()
        return f"✅ Task completed: {task_title} 🎉"
    except Exception as e:
        return f"Error: {str(e)}"

def get_shopping_list() -> str:
    """Returns current shopping list"""
    try:
        data = supabase.table("shopping_lists").select("*").eq("user_id", USER_ID).execute()
        if not data.data: return "🛒 Shopping list is empty!"
        items = [f"• {i['item_name']}" for i in data.data]
        return "🛒 Shopping List:\n" + "\n".join(items)
    except Exception as e:
        return f"Error: {str(e)}"
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

from tenacity import retry, stop_after_attempt, wait_exponential

import base64

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=4))
def _generate_with_retry(model_name: str, prompt: str, tools: list, system_instruction: str, image_base64: str = None) -> str:
    chat = client.chats.create(
        model=model_name,
        config=types.GenerateContentConfig(
            tools=tools,
            system_instruction=system_instruction
        )
    )
    
    contents = [prompt]
    if image_base64:
        try:
            header, encoded = image_base64.split(",", 1)
            mime_type = header.split(":")[1].split(";")[0]
            contents.append(
                types.Part.from_bytes(data=base64.b64decode(encoded), mime_type=mime_type)
            )
        except Exception:
            pass # fallback to text if image parsing fails
            
    return chat.send_message(contents).text

class LIVORAAgentDevelopmentKit:
    """
    Core ADK Wrapper for LIVORA Multi-Agent System.
    Demonstrates Agent Registration, Routing, Sub-agent delegation, and Memory Injection.
    """
    def __init__(self, client, user_id):
        self.client = client
        self.user_id = user_id
        self.agents = {}

    def register_agent(self, name: str, description: str, tools: list):
        """Registers a sub-agent into the ADK."""
        self.agents[name] = {
            "description": description,
            "tools": tools
        }
        print(f"✅ ADK: Registered Sub-Agent '{name}' with {len(tools)} tools.")

    def inject_memory(self, base_prompt: str, local_time: str = None) -> str:
        """Injects J.A.R.V.I.S. permanent memory dynamically into the agent's context."""
        profile = fetch_user_profile()
        prompt = f"{base_prompt}\n\n{profile}\nAlways use the provided facts about the user to tailor your responses."
        if local_time:
            prompt += f"\n[SYSTEM ALERT: The current real-world local time for the user is {local_time}.]"
        return prompt

    def delegate_to_sub_agent(self, agent_name: str, prompt: str, image_base64: str = None, local_time: str = None) -> str:
        """Routes task to the specific registered sub-agent and executes it."""
        if agent_name not in self.agents:
            return "Critical ADK Error: Agent not found."
        
        agent = self.agents[agent_name]
        full_instruction = self.inject_memory(agent["description"], local_time)
        print(f"🔄 ADK: Delegating task to {agent_name}...")
        
        try:
            return _generate_with_retry("gemini-2.5-flash", prompt, agent["tools"], full_instruction, image_base64)
        except Exception as e:
            error_to_check = e
            if hasattr(e, 'last_attempt') and e.last_attempt:
                error_to_check = e.last_attempt.exception() or e
            if "429" in str(error_to_check) or "quota" in str(error_to_check).lower():
                try:
                    return _generate_with_retry("gemini-3.1-flash-lite", prompt, agent["tools"], full_instruction, image_base64)
                except Exception as fallback_e:
                    return "LIVORA is experiencing extremely high traffic right now."
            return "I encountered a system error while processing that request."

    def route_request(self, user_input: str) -> str:
        """Intelligent Router: Determines which sub-agent should handle the user's request."""
        route_prompt = f"""
        Analyze the user's input and determine which agent should handle it.
        Input: "{user_input}"
        
        Agents available:
        - HOME: For meals, cooking, recipes, and shopping lists.
        - WORK: For tasks, deadlines, to-do lists, and reminders.
        - FAMILY: For calendar, appointments, and family events.
        - GENERAL: For general greetings, chatting, OR IF THE USER IS TELLING YOU A FACT ABOUT THEMSELVES.
        
        Reply ONLY with the exact word: HOME, WORK, FAMILY, or GENERAL.
        """
        try:
            routing_decision = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=route_prompt
            ).text.strip().upper()
        except:
            routing_decision = "GENERAL"
            
        print(f"🧭 ADK Router: Assigned task to {routing_decision} agent.")
        return routing_decision

# Initialize ADK
adk = LIVORAAgentDevelopmentKit(client, USER_ID)

# Register Sub-Agents
adk.register_agent(
    "HOME",
    "You are the LIVORA Home Agent. You help the user plan meals and manage their shopping list. If the user provides an image, identify the ingredients and suggest recipes. Be brief, warm, and helpful.",
    [add_meal_to_plan, add_to_shopping_list, get_shopping_list, get_todays_agenda]
)

adk.register_agent(
    "WORK",
    "You are the LIVORA Work Agent. You help the user manage tasks and deadlines. Be brief, professional, and efficient.",
    [add_work_task, get_todays_agenda, complete_task]
)

adk.register_agent(
    "FAMILY",
    "You are the LIVORA Family Agent. You help manage appointments and family schedules. Be brief, caring, and organized.",
    [add_family_appointment, get_todays_agenda]
)

adk.register_agent(
    "GENERAL",
    "You are LIVORA, a premium AI Life Orchestration System (like J.A.R.V.I.S.). VERY IMPORTANT: If the user tells you their name, city, job, family size, or any personal fact, you MUST explicitly call the save_memory tool BEFORE responding, and then tell them you noted it! You can also fetch weather and live search data using get_current_info. Be warm, brief, and helpful.",
    [save_memory, get_live_weather, update_user_city, get_current_info]
)


def generate_morning_briefing() -> str:
    """Generates the automatic morning briefing based on the user's profile."""
    try:
        # Get user profile
        profile_res = supabase.table("user_profile").select("*").eq("user_id", USER_ID).execute()
        profile = profile_res.data[0] if profile_res.data else {}
        city = profile.get("city", "Unknown") # Fallback to Unknown
        interests = profile.get("interests", "technology, science")
        
        # Get tasks for today
        tasks_res = supabase.table("tasks").select("*").eq("user_id", USER_ID).eq("status", "pending").execute()
        tasks = tasks_res.data
        task_list = [t['task_title'] for t in tasks] if tasks else []
        
        # Get appointments for today
        today = datetime.date.today().isoformat()
        appts_res = supabase.table("appointments").select("*").eq("user_id", USER_ID).gte("appointment_date", today).execute()
        appointments = appts_res.data
        appt_list = [f"{a['title']} ({a['appointment_date']})" for a in appointments] if appointments else []
        
        prompt = f"""
        Generate a beautiful, premium morning briefing for the user.
        Format it perfectly using markdown headers (##), emojis, and bullet points.
        
        You MUST include these 5 exact sections in this order:
        1. Real Weather: Use the get_live_weather tool and show the result with emojis.
        2. Today's Tasks: {task_list}
        3. Today's Appointments: {appt_list}
        4. Quick Breakfast Suggestion: Recommend a fast, healthy breakfast.
        5. Live News: Use get_current_info to fetch news about {interests}.
        
        Data available:
        - City: {city}. If city is Unknown, gently ask the user what city they are in at the end.
        - Interests: {interests}
        
        Make it sound like J.A.R.V.I.S speaking. Be concise, authoritative, but warm.
        """
        
        chat = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                tools=[get_live_weather, get_current_info],
                system_instruction="You are LIVORA generating the daily morning briefing. Use get_live_weather and get_current_info."
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

def process_chat(user_input: str, image_base64: str = None, local_time: str = None) -> str:
    """
    The Main LIVORA Orchestrator routes the user input to the correct sub-agent.
    """
    try:
        if user_input.strip() == "__TRIGGER_MORNING_BRIEFING__":
            return generate_morning_briefing()
            
        if user_input.strip().startswith("__SAVE_TIMEZONE__"):
            tz = user_input.replace("__SAVE_TIMEZONE__", "").strip()
            existing = supabase.table("user_memory").select("*").eq("user_id", USER_ID).eq("category", "timezone").execute()
            if not existing.data:
                save_memory("timezone", tz)
            else:
                supabase.table("user_memory").update({"fact": tz}).eq("user_id", USER_ID).eq("category", "timezone").execute()
            return "Silent Location Update: Timezone saved."
            
        if user_input.strip().startswith("__CHECK_LOCATION__"):
            current_city = user_input.replace("__CHECK_LOCATION__", "").strip()
            
            # Fetch home city from DB
            profile = supabase.table("user_profile").select("*").eq("user_id", USER_ID).execute()
            home_city = profile.data[0].get("city", "Unknown") if profile.data else "Unknown"
            
            if home_city != current_city and home_city != "Unknown":
                # Prompt the agent to compare times
                prompt = f"""
                The user's permanent home city is {home_city}.
                However, their current network IP was just detected in {current_city}.
                They might be traveling or using a VPN. 
                Briefly inform them that you noticed they are in {current_city}, and tell them BOTH the current time in {home_city} AND the current time in {current_city}.
                Keep it brief, warm, and helpful. Use get_current_info if you need to check the times.
                """
                return adk.delegate_to_sub_agent("GENERAL", prompt, None, local_time)
                
            return "Silent Location Update: User is at home."

        # ADK Agent Routing
        routing_decision = adk.route_request(user_input)
        
        # Ensure routing falls back to GENERAL if invalid
        if routing_decision not in ["HOME", "WORK", "FAMILY", "GENERAL"]:
            routing_decision = "GENERAL"
            
        # Delegate task to sub-agent
        return adk.delegate_to_sub_agent(routing_decision, user_input, image_base64, local_time)
        
    except Exception as outer_e:
        import traceback
        traceback.print_exc()
        return "Critical Route Error."
