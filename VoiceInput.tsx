import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening?: boolean;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = '' }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setListening(false);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-full transition-all duration-300 ${
        listening 
          ? 'bg-red-100 text-red-600 animate-pulse' 
          : 'bg-earth-100 text-earth-700 hover:bg-earth-200'
      } ${className}`}
      title="Voice Input"
    >
      {listening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
};

export default VoiceInput;