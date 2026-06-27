import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Webcam from 'react-webcam';

const thinkingMessages = [
  "LIVORA is thinking...",
  "Consulting the brain...",
  "Organizing your life...",
  "Almost there..."
];

function UIClock({ timezone }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      try {
        const t = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(new Date());
        setTime(t);
      } catch (e) { setTime(""); }
    };
    updateTime();
    const intv = setInterval(updateTime, 10000);
    return () => clearInterval(intv);
  }, [timezone]);
  
  const displayCity = timezone ? timezone.split('/').pop().replace('_', ' ').toUpperCase() : "LOCAL";
  
  return <div className="text-teal-300 font-mono text-sm tracking-widest bg-teal-900/20 px-3 py-1 rounded-full border border-teal-500/20">{time} ({displayCity})</div>;
}

function ThinkingIndicator() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start animate-fade-in mb-2">
      <div className="bubble-livora px-5 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full typing-dot"></span>
          <span className="w-1.5 h-1.5 rounded-full typing-dot"></span>
          <span className="w-1.5 h-1.5 rounded-full typing-dot"></span>
        </div>
        <span className="text-[14px] font-medium text-purple-300 transition-opacity duration-300">
          {thinkingMessages[msgIndex]}
        </span>
      </div>
    </div>
  );
}

function CustomDropdown({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-blue-900/40 border border-blue-500/30 text-blue-100 text-sm rounded-xl p-3 flex justify-between items-center focus:outline-none focus:border-blue-400 hover:bg-blue-800/40 transition-colors shadow-inner"
      >
        <span>{selectedOption.label}</span>
        <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-[#12082b] border border-blue-500/30 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${value === opt.value ? 'bg-blue-600/30 text-white font-medium' : 'text-blue-200 hover:bg-blue-800/40'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AudioWaveform() {
  return (
    <div className="flex items-center gap-1 h-4 ml-3">
      <div className="w-1 bg-teal-400 rounded-full animate-wave [animation-delay:-0.4s]"></div>
      <div className="w-1 bg-teal-400 rounded-full animate-wave [animation-delay:-0.2s]"></div>
      <div className="w-1 bg-teal-400 rounded-full animate-wave [animation-delay:0s]"></div>
      <div className="w-1 bg-teal-400 rounded-full animate-wave [animation-delay:-0.3s]"></div>
      <div className="w-1 bg-teal-400 rounded-full animate-wave [animation-delay:-0.1s]"></div>
    </div>
  );
}

function LeftSidebarContent({ dashboardData }) {
  return (
    <>
      <div>
        <h2 className="font-display text-teal-400 font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          Today's Agenda
        </h2>
        <div className="flex flex-col gap-3">
          {dashboardData.tasks?.length > 0 ? dashboardData.tasks.map(t => (
            <div key={t.id} className="p-3 rounded-lg bg-indigo-900/20 border border-indigo-500/20 text-sm">
              <div className="font-medium text-indigo-200">{t.task_title}</div>
              {t.due_date && <div className="text-xs text-indigo-400 mt-1">Due: {t.due_date}</div>}
            </div>
          )) : (
            <div className="text-sm text-gray-400 italic">No pending tasks.</div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-purple-400 font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          Appointments
        </h2>
        <div className="flex flex-col gap-3">
          {dashboardData.appointments?.length > 0 ? dashboardData.appointments.map(a => (
            <div key={a.id} className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/20 text-sm">
              <div className="font-medium text-purple-200">{a.title}</div>
              <div className="text-xs text-purple-400 mt-1">{a.appointment_date}</div>
            </div>
          )) : (
            <div className="text-sm text-gray-400 italic">No appointments.</div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-amber-400 font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Meals Today
        </h2>
        <div className="flex flex-col gap-3">
          {dashboardData.meals?.length > 0 ? dashboardData.meals.map(m => (
            <div key={m.id} className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20 text-sm">
              <div className="font-medium text-amber-200">{m.meal_name}</div>
              {m.ingredients && <div className="text-xs text-amber-400 mt-1 line-clamp-2">{m.ingredients}</div>}
            </div>
          )) : (
            <div className="text-sm text-gray-400 italic">No meals planned.</div>
          )}
        </div>
      </div>
    </>
  );
}

function RightSidebarContent({ dashboardData, handleQuickAction, voiceEnabled, handleVoiceToggle, handleVoiceChange }) {
  return (
    <>
      <div>
        <h2 className="font-display text-blue-400 font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          Voice Settings
        </h2>
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-200">Enable Voice</span>
            <button 
              onClick={() => handleVoiceToggle(!voiceEnabled)}
              className={`w-10 h-5 rounded-full relative transition-colors ${voiceEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${voiceEnabled ? 'left-5' : 'left-0.5'}`}></div>
            </button>
          </div>
          
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-blue-300">Voice Persona</span>
              <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded border border-blue-500/20 font-medium">
                Quota: {20 - (dashboardData.tts_quota?.count || 0)}/20
              </span>
            </div>
            <CustomDropdown 
              value={dashboardData.voice_name || 'Aoede'}
              onChange={handleVoiceChange}
              options={[
                { value: 'Aoede', label: 'Aoede (Warm & Natural)' },
                { value: 'Leda', label: 'Leda (Clear & Professional)' },
                { value: 'Zephyr', label: 'Zephyr (Bright & Energetic)' },
                { value: 'Autonoe', label: 'Autonoe (Soft & Elegant)' },
                { value: 'Sulafat', label: 'Sulafat (Rich & Authoritative)' }
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-indigo-400 font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          Profile
        </h2>
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 flex flex-col items-center text-center">
           <img src="/logo.png" alt="LIVORA" className="w-16 h-16 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.3)] mb-3 object-cover" />
           <div className="text-white font-medium">Assia</div>
           <div className="text-xs text-indigo-300 mt-1">Home: {dashboardData.city}</div>
        </div>
      </div>

      {dashboardData.weather && (
        <div>
          <h2 className="font-display text-sky-400 font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Today's Weather
          </h2>
          <div className="p-4 rounded-xl bg-gradient-to-br from-sky-900/40 to-indigo-900/30 border border-sky-500/30 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{dashboardData.weather.temp}</div>
              <div className="text-sm text-sky-200 mt-1">{dashboardData.weather.description}</div>
              <div className="text-xs text-sky-400 mt-1 opacity-80">{dashboardData.city}</div>
            </div>
            <div className="text-4xl">{dashboardData.weather.emoji}</div>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-emerald-400 font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Quick Actions
        </h2>
        <div className="flex flex-col gap-2">
          <button onClick={() => handleQuickAction("Add a task: ")} className="p-3 text-left rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-sm text-emerald-200 hover:bg-emerald-800/40 transition-colors flex items-center gap-2">
            <span className="text-lg">+</span> Add Task
          </button>
          <button onClick={() => handleQuickAction("Schedule an appointment: ")} className="p-3 text-left rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-sm text-emerald-200 hover:bg-emerald-800/40 transition-colors flex items-center gap-2">
            <span className="text-lg">+</span> Add Appointment
          </button>
          <button onClick={() => handleQuickAction("Plan a meal: ")} className="p-3 text-left rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-sm text-emerald-200 hover:bg-emerald-800/40 transition-colors flex items-center gap-2">
            <span className="text-lg">+</span> Add Meal
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-display text-pink-400 font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-400"></span>
          Shopping List
        </h2>
        <div className="flex flex-col gap-2">
          {dashboardData.shopping_list?.length > 0 ? dashboardData.shopping_list.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-2 text-sm text-pink-100 hover:bg-pink-900/20 rounded-lg transition-colors">
              <div className="w-4 h-4 rounded border border-pink-500/40"></div>
              {item.item_name}
            </div>
          )) : (
            <div className="text-sm text-gray-400 italic">Cart is empty.</div>
          )}
        </div>
      </div>
    </>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Good morning! I am LIVORA, your personal Life Operating System. I am preparing your daily briefing...", sender: 'livora' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const webcamRef = useRef(null);
  const inputRef = useRef(null);
  const currentAudio = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Live API States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveWsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const toggleLiveMode = async () => {
    if (isLiveActive) {
      setIsLiveActive(false);
      liveWsRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
      return;
    }

    try {
      setIsLiveActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
      mediaStreamRef.current = stream;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${API_BASE.replace(/^https?:\/\//, '')}/live`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioCtx.destination);
      
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          ws.send(pcmData.buffer);
        }
      };

      ws.onmessage = async (e) => {
        if (e.data instanceof Blob) {
          const arrayBuffer = await e.data.arrayBuffer();
          const audioBuffer = audioCtx.createBuffer(1, arrayBuffer.byteLength / 2, 16000);
          const channelData = audioBuffer.getChannelData(0);
          const int16Array = new Int16Array(arrayBuffer);
          for (let i = 0; i < int16Array.length; i++) {
            channelData[i] = int16Array[i] / 32768.0;
          }
          const bufferSource = audioCtx.createBufferSource();
          bufferSource.buffer = audioBuffer;
          bufferSource.connect(audioCtx.destination);
          bufferSource.start();
        }
      };

      ws.onclose = () => {
        setIsLiveActive(false);
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        audioContextRef.current?.close();
      };
    } catch (e) {
      console.error("Live audio error", e);
      setIsLiveActive(false);
    }
  };

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState({ tasks: [], appointments: [], shopping_list: [], city: "Unknown", timezone: null });

  const getFullDatetimeContext = () => {
    try {
      const tz = dashboardData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(now);
      const date = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(now);
      return `Date: ${date} | Time: ${time} | Timezone: ${tz}`;
    } catch {
      return new Date().toLocaleString();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuickAction = (text) => {
    setIsDrawerOpen(false);
    setInput(text);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleVoiceToggle = (enabled) => setVoiceEnabled(enabled);

  const handleVoiceChange = async (voice_name) => {
    setDashboardData(prev => ({...prev, voice_name}));
    try {
      await fetch(`${API_BASE}/settings/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_name })
      });
    } catch(e) {}
  };

  const pauseAudio = () => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      setIsSpeaking(false);
      setIsPaused(true);
    } else if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
      setIsPaused(true);
    }
  };

  const resumeAudio = () => {
    if (currentAudio.current) {
      currentAudio.current.play();
      setIsSpeaking(true);
      setIsPaused(false);
    } else if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  const stopAudio = () => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const playLivoraVoice = async (text, forcePlay = false) => {
    stopAudio();
    if (!voiceEnabled && !forcePlay) return;
    
    if (!forcePlay && text.split(/\s+/).length > 50) {
      return; // Skip auto-play for long messages to save Layer 1 quota
    }
    
    setIsSpeaking(true);
    setIsPaused(false);
    try {
      const cleanText = text.replace(/[#*`_]/g, '');
      const res = await fetch(`${API_BASE}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice_name: dashboardData.voice_name || 'Aoede' })
      });
      const data = await res.json();
      if (data.audio_base64) {
        const audio = new Audio("data:audio/wav;base64," + data.audio_base64);
        currentAudio.current = audio;
        audio.onended = () => { setIsSpeaking(false); setIsPaused(false); };
        audio.play();
      } else {
        // Fallback to browser TTS if Gemini rate limit hit
        console.warn("Gemini TTS failed or rate limited, falling back to browser TTS", data.error);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      const cleanText = text.replace(/[#*`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
      window.speechSynthesis.speak(utterance);
    }
  };

  // Fetch Dashboard Data
  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      const data = await res.json();
      setDashboardData(data);
      
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!data.timezone && localTz) {
        await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `__SAVE_TIMEZONE__${localTz}` }),
        });
        setDashboardData(prev => ({...prev, timezone: localTz}));
      }
    } catch (e) {
      console.error("Dashboard fetch failed", e);
    }
  };

  // Trigger Morning Briefing on first load
  useEffect(() => {
    fetchDashboard();

    const hour = new Date().getHours();
    if (hour < 5 || hour >= 12) return;

    const fetchBriefing = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: "__TRIGGER_MORNING_BRIEFING__",
            local_time: getFullDatetimeContext()
          }),
        });
        const data = await response.json();
        
        setMessages([
          { id: Date.now(), text: data.response, sender: 'livora' }
        ]);
      } catch (error) {
        setMessages([
          { id: Date.now(), text: "Good morning! (Offline Mode) I am unable to connect to my servers to fetch your briefing.", sender: 'livora' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBriefing();
  }, []);

  // Geolocation VPN / Timezone Check
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
          const data = await res.json();
          if (data.city) {
            const resp = await fetch(`${API_BASE}/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                message: `__CHECK_LOCATION__${data.city}`,
                local_time: getFullDatetimeContext()
              }),
            });
            const chatData = await resp.json();
            // Show alert if the backend noticed a location mismatch
            if (!chatData.response.startsWith("Silent")) {
              setMessages(prev => [...prev, { id: Date.now() + 10, text: chatData.response, sender: 'livora' }]);
              playLivoraVoice(chatData.response);
            }
          }
        } catch (e) {
          console.log("Geolocation API failed.");
        }
      });
    }
  }, []);

  const fileInputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.text,
          local_time: getFullDatetimeContext()
        }),
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.response,
        sender: 'livora'
      }]);
      playLivoraVoice(data.response);
      fetchDashboard(); // Refresh sidebars
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to my central node. Please try again.",
        sender: 'livora'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      
      setMessages(prev => [...prev, { id: Date.now(), text: "📸 I sent a photo of my ingredients.", sender: 'user' }]);
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: "What meals can I make with the ingredients in this image? Please give me recipes and add missing ingredients to my shopping list.", 
            image: base64Image,
            local_time: getFullDatetimeContext()
          }),
        });
        const data = await response.json();
        
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.response,
          sender: 'livora'
        }]);
        playLivoraVoice(data.response);
        fetchDashboard();
      } catch (err) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "I'm having trouble analyzing that image right now.",
          sender: 'livora'
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setShowCamera(false);
    
    setMessages(prev => [...prev, { id: Date.now(), text: "📸 I sent a photo of my ingredients.", sender: 'user' }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: "What meals can I make with the ingredients in this image? Please give me recipes and add missing ingredients to my shopping list.", 
          image: imageSrc,
          local_time: getFullDatetimeContext()
        }),
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.response,
        sender: 'livora'
      }]);
      playLivoraVoice(data.response);
      fetchDashboard();
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm having trouble analyzing that image right now.",
        sender: 'livora'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-transparent overflow-hidden font-sans text-slate-200">
      
      {/* HEADER */}
      <header className="glass-header p-4 lg:p-5 z-20 flex justify-between items-center md:px-8 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden p-2 -ml-2 text-teal-400 hover:bg-teal-900/30 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="relative">
            <img src="/logo.png" alt="LIVORA" className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-3.5 lg:h-3.5 bg-green-400 rounded-full border-2 border-[#100525] animate-pulse-slow"></div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center">
              <h1 className="text-xl lg:text-2xl font-bold font-display tracking-[0.15em] animate-shimmer">LIVORA</h1>
              {isSpeaking && <AudioWaveform />}
            </div>
            <p className="text-teal-300 text-[9px] lg:text-[10px] font-medium tracking-[0.2em] uppercase opacity-90">Life Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <UIClock timezone={dashboardData.timezone} />
          </div>
          {(isSpeaking || isPaused) ? (
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full backdrop-blur-md border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
               {isSpeaking ? (
                 <button onClick={pauseAudio} className="w-8 h-8 flex items-center justify-center bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded-full transition-colors" title="Pause">⏸️</button>
               ) : (
                 <button onClick={resumeAudio} className="w-8 h-8 flex items-center justify-center bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-full transition-colors" title="Resume">▶️</button>
               )}
               <button onClick={stopAudio} className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-full transition-colors" title="Stop">⏹️</button>
            </div>
          ) : (
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 lg:p-2.5 rounded-full backdrop-blur-sm transition-all duration-300 ${voiceEnabled ? 'bg-teal-600/20 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.2)]' : 'bg-gray-800/50 text-gray-500'}`}
              title="Toggle Voice TTS"
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
          )}
        </div>
      </header>

      {/* RESPONSIVE 3-PANEL LAYOUT */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto overflow-hidden relative">
        
        {/* LEFT SIDEBAR (Desktop Only) */}
        <aside className="hidden lg:flex w-[320px] flex-col p-6 gap-8 overflow-y-auto border-r border-purple-900/30 bg-[#0a0515]/40 backdrop-blur-md custom-scrollbar">
          <LeftSidebarContent dashboardData={dashboardData} />
        </aside>

        {/* CENTER MAIN CHAT (All Sizes) */}
        <main className="flex-1 flex flex-col relative w-full h-full max-w-3xl mx-auto">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 pb-32 md:pb-36 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end animate-message-slide-right' : 'justify-start items-end gap-2 animate-message-slide-up'}`}>
                {msg.sender === 'livora' && (
                  <img src="/logo.png" alt="LIVORA Avatar" className="w-8 h-8 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)] mb-1 object-cover flex-shrink-0" />
                )}
                <div className={`
                  px-5 py-4 max-w-[85%] md:max-w-[70%] text-[15px] leading-relaxed
                  ${msg.sender === 'user' 
                    ? 'bubble-user' 
                    : 'bubble-livora'}
                `}>
                  {msg.sender === 'user' ? (
                    <p>{msg.text}</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                      <div className="flex justify-start">
                        <button 
                          onClick={() => playLivoraVoice(msg.text, true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-900/30 border border-teal-500/20 text-teal-300 text-xs font-medium hover:bg-teal-800/50 transition-colors shadow-sm"
                        >
                          🔊 Play Audio
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && <ThinkingIndicator />}
            {isSpeaking && (
              <div className="flex items-center gap-3 text-teal-300 text-sm font-medium animate-pulse ml-12 bg-[#0a0515]/60 border border-teal-500/20 p-3 rounded-2xl w-fit">
                <AudioWaveform />
                <span>LIVORA is speaking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="absolute bottom-0 w-full p-4 glass-header border-t-0 md:border md:border-purple-500/20 md:mb-6 md:rounded-3xl md:w-[95%] md:left-1/2 md:-translate-x-1/2 md:shadow-2xl md:bg-[#150a2e]/80">
            <form onSubmit={handleSend} className="glass-input relative flex items-center rounded-full p-1.5 gap-1">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={handleImageCapture} 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={toggleLiveMode}
                className={`p-3 rounded-full transition-all flex items-center justify-center gap-1 ${isLiveActive ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]' : 'text-rose-400 hover:bg-rose-900/30 hover:text-rose-200'}`}
                title="Live Audio Connection"
              >
                🎙️
              </button>
              <button 
                type="button"
                onClick={() => setShowCamera(true)}
                className="p-3 text-teal-400 hover:bg-teal-900/30 hover:text-teal-200 rounded-full transition-colors"
                title="Scan Fridge"
              >
                📸
              </button>
              <button 
                type="button"
                onClick={startListening}
                className={`p-3 rounded-full transition-all ${isListening ? 'bg-teal-600 text-white animate-pulse shadow-[0_0_15px_rgba(45,212,191,0.6)]' : 'text-teal-400 hover:bg-teal-900/30 hover:text-teal-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
              
              <input
                type="text"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message LIVORA..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 px-2 placeholder-purple-300/50 text-[15px] outline-none w-full"
                disabled={isLoading || isListening}
              />
              
              <button 
                type="submit" 
                disabled={isLoading || !input.trim() || isListening}
                className="p-3 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-full shadow-[0_0_15px_rgba(45,212,191,0.4)] hover:shadow-[0_0_20px_rgba(45,212,191,0.6)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </main>

        {/* RIGHT SIDEBAR (Tablet & Desktop) */}
        <aside className="hidden md:flex w-[280px] lg:w-[320px] flex-col p-6 gap-8 overflow-y-auto border-l border-purple-900/30 bg-[#0a0515]/40 backdrop-blur-md custom-scrollbar">
          <RightSidebarContent dashboardData={dashboardData} handleQuickAction={handleQuickAction} voiceEnabled={voiceEnabled} handleVoiceToggle={handleVoiceToggle} handleVoiceChange={handleVoiceChange} />
        </aside>

      </div>
      
      {/* MOBILE DRAWER (Hamburger Menu) */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-[320px] bg-[#0a0515]/95 border-r border-purple-900/50 h-full overflow-y-auto p-6 flex flex-col gap-8 shadow-2xl animate-slide-right custom-scrollbar">
            <LeftSidebarContent dashboardData={dashboardData} />
            <div className="w-full h-px bg-purple-900/40 my-2"></div>
            <RightSidebarContent dashboardData={dashboardData} handleQuickAction={handleQuickAction} voiceEnabled={voiceEnabled} handleVoiceToggle={handleVoiceToggle} handleVoiceChange={handleVoiceChange} />
          </div>
        </div>
      )}
      
      {showCamera && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(45,212,191,0.3)] border border-teal-500/30">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-auto object-cover"
            />
            <button 
              onClick={() => setShowCamera(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-red-500/80 text-white rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <button 
                onClick={capturePhoto}
                className="bg-teal-500 hover:bg-teal-400 text-white rounded-full h-16 w-16 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.5)] border-4 border-white/20 transition-transform active:scale-95 text-2xl"
              >
                📸
              </button>
            </div>
          </div>
          <p className="text-teal-300 mt-4 font-display tracking-widest text-sm animate-pulse">POSITION FRIDGE CONTENTS IN FRAME</p>
        </div>
      )}

    </div>
  );
}

export default App;
