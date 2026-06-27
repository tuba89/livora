import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const thinkingMessages = [
  "LIVORA is thinking...",
  "Consulting the brain...",
  "Organizing your life...",
  "Almost there..."
];

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
      <div className="rounded-2xl px-5 py-3 bg-white/80 backdrop-blur-md text-indigo-600 rounded-bl-none border border-indigo-100 shadow-sm flex items-center gap-3">
        <div className="flex gap-1">
          <span className="animate-bounce inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
          <span className="animate-bounce delay-100 inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full" style={{animationDelay: '150ms'}}></span>
          <span className="animate-bounce delay-200 inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full" style={{animationDelay: '300ms'}}></span>
        </div>
        <span className="text-[14px] font-medium transition-opacity duration-300">
          {thinkingMessages[msgIndex]}
        </span>
      </div>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Good morning! I am LIVORA, your personal Life Operating System. I am preparing your daily briefing...", sender: 'livora' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev + 1) % thinkingMessages.length);
      }, 2500);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    // Strip markdown for clean speech
    const cleanText = text.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger Morning Briefing on first load (5 AM to 11 AM)
  useEffect(() => {
    const hour = new Date().getHours();
    // Only trigger if morning
    if (hour < 5 || hour >= 12) return;

    const fetchBriefing = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: "__TRIGGER_MORNING_BRIEFING__" }),
        });
        const data = await response.json();
        
        setMessages([
          { id: Date.now(), text: data.response, sender: 'livora' }
        ]);
        speak(data.response);
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

  // Get User's Geolocation automatically
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
          const data = await res.json();
          if (data.city) {
            await fetch('http://localhost:8000/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: `__UPDATE_CITY__${data.city}` }),
            });
          }
        } catch (e) {
          console.log("Geolocation API failed.");
        }
      }, (error) => {
        // Fallback if denied or unavailable
        setMessages(prev => [...prev, { id: Date.now() + 2, text: "I couldn't detect your location to set up your weather feed. What city do you live in?", sender: 'livora' }]);
        speak("I couldn't detect your location. What city do you live in?");
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
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.response,
        sender: 'livora'
      }]);
      speak(data.response);
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
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: "What meals can I make with the ingredients in this image? Please give me recipes and add missing ingredients to my shopping list.", image: base64Image }),
        });
        const data = await response.json();
        
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.response,
          sender: 'livora'
        }]);
        speak(data.response);
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden font-sans">
      
      <header className="glass-header text-white p-5 z-10 sticky top-0 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1 rounded-xl backdrop-blur-md shadow-sm">
            <img src="/logo.png" alt="LIVORA" className="w-10 h-10 rounded-lg object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-wide">LIVORA</h1>
            <p className="text-indigo-100 text-xs font-medium tracking-wider uppercase opacity-90">Life Intelligence</p>
          </div>
        </div>
        <button 
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${voiceEnabled ? 'bg-indigo-500/30 text-white' : 'bg-gray-500/30 text-gray-300'}`}
          title="Toggle Voice TTS"
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 pb-24">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex animate-message-enter ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
            {msg.sender === 'livora' && (
              <img src="/logo.png" alt="LIVORA Avatar" className="w-8 h-8 rounded-full shadow-sm mb-1 object-cover" />
            )}
            <div className={`
              rounded-2xl px-5 py-3.5 max-w-[85%] shadow-sm text-[15px] leading-relaxed
              ${msg.sender === 'user' 
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm' 
                : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}
            `}>
              {msg.sender === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-indigo prose-p:leading-relaxed prose-a:text-indigo-600 prose-headings:font-display prose-headings:text-indigo-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <ThinkingIndicator stage={loadingStage} />}
        <div ref={messagesEndRef} />
      </main>

      <div className="absolute bottom-0 w-full p-4 glass-header border-t border-white/10">
        <form onSubmit={handleSend} className="relative flex items-center bg-white rounded-full p-1.5 shadow-lg shadow-indigo-900/10 border border-indigo-100/50 gap-1">
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
            onClick={() => fileInputRef.current.click()}
            className="p-3 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors"
            title="Scan Fridge"
          >
            📸
          </button>
          <button 
            type="button"
            onClick={startListening}
            className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell LIVORA..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 px-2 placeholder-gray-400 text-[15px]"
            disabled={isLoading || isListening}
          />
          
          <button 
            type="submit" 
            disabled={isLoading || !input.trim() || isListening}
            className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-md transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
