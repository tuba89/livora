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

from fastapi import FastAPI
from pydantic import BaseModel
import os

from agents.livora_orchestrator import process_chat

app = FastAPI(title="LIVORA Agent API")

# Add CORS middleware so React frontend can call this backend
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    # Pass user message to LIVORA Orchestrator
    try:
        reply = process_chat(request.message)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
