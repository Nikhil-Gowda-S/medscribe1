'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Mic, Square, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  initialTranscript?: string;
}

export function VoiceRecorder({
  onTranscriptUpdate,
  initialTranscript = '',
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isSupported, setIsSupported] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef(initialTranscript); // Track final transcript separately
  const isRecordingRef = useRef(false); // Track recording state with ref for reliable access
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when initialTranscript changes
  useEffect(() => {
    finalTranscriptRef.current = initialTranscript;
    setTranscript(initialTranscript);
  }, [initialTranscript]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      // Disable interim results to prevent duplicate/overlapping text
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Only final results - no interim, so no duplication
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript;
            if (text.trim()) {
              finalTranscriptRef.current += text + ' ';
              const displayTranscript = finalTranscriptRef.current.trim();
              setTranscript(displayTranscript);
              onTranscriptUpdate(displayTranscript);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Don't stop on 'no-speech' errors - just restart
        if (event.error === 'no-speech') {
          // Silently restart if still recording
          if (isRecordingRef.current && recognitionRef.current) {
            setTimeout(() => {
              try {
                if (isRecordingRef.current && recognitionRef.current) {
                  recognitionRef.current.start();
                }
              } catch (e) {
                console.log('Restart after no-speech:', e);
              }
            }, 100);
          }
          return;
        }
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please enable it in your browser settings.');
          setIsRecording(false);
          isRecordingRef.current = false;
        } else if (event.error === 'aborted') {
          // Aborted is normal when we stop manually
          return;
        } else {
          console.error('Speech recognition error:', event.error);
          // Try to restart on other errors if still recording
          if (isRecordingRef.current && recognitionRef.current) {
            setTimeout(() => {
              try {
                if (isRecordingRef.current && recognitionRef.current) {
                  recognitionRef.current.start();
                }
              } catch (e) {
                console.log('Restart after error:', e);
              }
            }, 500);
          }
        }
      };

      recognition.onend = () => {
        // Always try to restart if we're still supposed to be recording
        if (isRecordingRef.current && recognitionRef.current) {
          // Small delay to avoid immediate restart issues
          setTimeout(() => {
            try {
              if (isRecordingRef.current && recognitionRef.current) {
                recognitionRef.current.start();
              }
            } catch (e) {
              // If restart fails, it might be because it's already starting
              // Try once more after a longer delay
              setTimeout(() => {
                if (isRecordingRef.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (e2) {
                    console.log('Failed to restart recognition:', e2);
                    setIsRecording(false);
                    isRecordingRef.current = false;
                  }
                }
              }, 1000);
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      toast.error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        isRecordingRef.current = true;
        setRecordingDuration(0);
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
        
        toast.success('Recording started');
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Failed to start recording');
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      toast.success('Recording stopped');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari for the best experience.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? 'danger' : 'primary'}
          className="flex items-center gap-2"
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Recording
            </>
          )}
        </Button>
        {isRecording && (
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Recording... {formatDuration(recordingDuration)}
            </span>
          </div>
        )}
      </div>

      <div className="relative">
        <textarea
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            onTranscriptUpdate(e.target.value);
          }}
          placeholder="Transcript will appear here as you speak..."
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y font-mono text-sm"
        />
        {transcript && (
          <div className="absolute top-2 right-2 text-xs text-gray-500">
            {transcript.split(/\s+/).length} words
          </div>
        )}
      </div>
    </div>
  );
}
