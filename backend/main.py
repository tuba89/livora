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

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import os
import datetime
import requests
import base64
import json
import asyncio
from google import genai
from google.genai import types
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

genai_client = genai.Client()

from agents.livora_orchestrator import process_chat

app = FastAPI(title="LIVORA Agent API")

# Initialize Supabase
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

USER_ID = "00000000-0000-0000-0000-000000000000"

# Add CORS middleware so React frontend can call this backend
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

class ChatRequest(BaseModel):
    message: str
    image: Optional[str] = None
    local_time: Optional[str] = None

@app.post("/chat")
async def chat(request: ChatRequest):
    # Pass user message to LIVORA Orchestrator
    try:
        reply = process_chat(request.message, request.image, request.local_time)
        return {"response": reply}
    except Exception as e:
        error_msg = str(e)
        if "503" in error_msg or "UNAVAILABLE" in error_msg:
            return {"response": "My brain is experiencing very high traffic right now! 🧠 Please give me a few seconds and try asking again."}
        elif "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return {"response": "I'm thinking a little too fast! 🧠 We hit the Google API rate limit (5 requests per minute). Please wait 15 seconds and try again."}
        return {"response": f"Error: {error_msg}"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

class SpeakRequest(BaseModel):
    text: str
    voice_name: str = "Aoede"

@app.post("/speak")
async def speak(request: SpeakRequest):
    try:
        today = datetime.date.today().isoformat()
        res = supabase.table("user_memory").select("*").eq("user_id", USER_ID).eq("category", "tts_quota").execute()
        quota_data = {'date': today, 'count': 0}
        quota_id = None
        if res.data:
            quota_id = res.data[0]['id']
            try:
                parsed = json.loads(res.data[0]['fact'])
                if parsed.get('date') == today:
                    quota_data = parsed
            except: pass

        if quota_data['count'] >= 20:
            return {"error": "Daily TTS Quota (20) exceeded", "audio_base64": None}
            
        try:
            response = genai_client.models.generate_content(
                model='gemini-2.5-flash-preview-tts',
                contents=request.text,
                config=types.GenerateContentConfig(
                    response_modalities=['AUDIO'],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=request.voice_name
                            )
                        )
                    )
                )
            )
        except Exception:
            # Fallback
            response = genai_client.models.generate_content(
                model='gemini-3.1-flash-tts',
                contents=request.text,
                config=types.GenerateContentConfig(
                    response_modalities=['AUDIO'],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=request.voice_name
                            )
                        )
                    )
                )
            )
            
        audio_data = response.candidates[0].content.parts[0].inline_data.data
        base64_audio = base64.b64encode(audio_data).decode('utf-8')
        
        # Increment quota
        quota_data['count'] += 1
        if quota_id:
            supabase.table("user_memory").update({"fact": json.dumps(quota_data)}).eq("id", quota_id).execute()
        else:
            supabase.table("user_memory").insert({"user_id": USER_ID, "category": "tts_quota", "fact": json.dumps(quota_data)}).execute()
            
        return {"audio_base64": base64_audio}
    except Exception as e:
        return {"error": str(e)}

class VoiceSettingRequest(BaseModel):
    voice_name: str

@app.post("/settings/voice")
async def save_voice_setting(request: VoiceSettingRequest):
    try:
        existing = supabase.table("user_memory").select("*").eq("user_id", USER_ID).eq("category", "voice").execute()
        if not existing.data:
            supabase.table("user_memory").insert({"user_id": USER_ID, "category": "voice", "fact": request.voice_name}).execute()
        else:
            supabase.table("user_memory").update({"fact": request.voice_name}).eq("user_id", USER_ID).eq("category", "voice").execute()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/dashboard")
async def get_dashboard():
    try:
        today = datetime.date.today().isoformat()
        
        tasks_res = supabase.table("tasks").select("*").eq("user_id", USER_ID).eq("status", "pending").execute()
        appts_res = supabase.table("appointments").select("*").eq("user_id", USER_ID).gte("appointment_date", today).execute()
        shopping_res = supabase.table("shopping_lists").select("*").eq("user_id", USER_ID).execute()
        profile_res = supabase.table("user_profile").select("*").eq("user_id", USER_ID).execute()
        memory_res = supabase.table("user_memory").select("*").eq("user_id", USER_ID).eq("category", "timezone").execute()
        meals_res = supabase.table("meals").select("*").eq("user_id", USER_ID).gte("scheduled_for", today).execute()
        
        city = profile_res.data[0].get("city", "Unknown") if profile_res.data else "Unknown"
        timezone = memory_res.data[0].get("fact") if memory_res.data else None
        
        voice_res = supabase.table("user_memory").select("*").eq("user_id", USER_ID).eq("category", "voice").execute()
        voice_name = voice_res.data[0].get("fact") if voice_res.data else "Aoede"
        
        quota_res = supabase.table("user_memory").select("*").eq("user_id", USER_ID).eq("category", "tts_quota").execute()
        tts_quota = {"date": today, "count": 0}
        if quota_res.data:
            try:
                parsed = json.loads(quota_res.data[0]['fact'])
                if parsed.get('date') == today:
                    tts_quota = parsed
            except: pass
        
        weather_data = None
        if city and city != "Unknown":
            try:
                w_resp = requests.get(f"https://wttr.in/{city}?format=%t|%C|%c", timeout=3)
                if w_resp.status_code == 200:
                    parts = w_resp.text.strip().split('|')
                    if len(parts) >= 3:
                        weather_data = {
                            "temp": parts[0].strip(),
                            "description": parts[1].strip(),
                            "emoji": parts[2].strip()
                        }
            except Exception:
                pass
        
        return {
            "tasks": tasks_res.data,
            "appointments": appts_res.data,
            "shopping_list": shopping_res.data,
            "meals": meals_res.data,
            "weather": weather_data,
            "city": city,
            "timezone": timezone,
            "voice_name": voice_name,
            "tts_quota": tts_quota
        }
    except Exception as e:
        return {"error": str(e)}

@app.websocket("/live")
async def live_audio_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        async with genai_client.models.aio.connect(
            model='gemini-2.5-flash-native-audio-dialog',
            config=types.LiveConnectConfig(
                response_modalities=['AUDIO']
            )
        ) as session:
            
            async def receive_from_ws():
                try:
                    while True:
                        data = await websocket.receive_bytes()
                        await session.send(input={"data": data, "mime_type": "audio/pcm;rate=16000"})
                except WebSocketDisconnect:
                    pass
                except Exception as e:
                    print("WS error", e)
            
            async def receive_from_gemini():
                async for response in session.receive():
                    if response.server_content and response.server_content.model_turn:
                        for part in response.server_content.model_turn.parts:
                            if part.inline_data:
                                await websocket.send_bytes(part.inline_data.data)

            await asyncio.gather(receive_from_ws(), receive_from_gemini())
    except Exception as e:
        print("Live API error:", e)
    finally:
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
