import { useState, useEffect } from "react";
import { Room, createLocalAudioTrack, Track } from "livekit-client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { useToast } from "./ui/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

interface VoiceAgentProps {
  onBack?: () => void;
}

export default function VoiceAgent({ onBack }: VoiceAgentProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  

  const TOKEN_SERVER_BASE = (import.meta.env.VITE_TOKEN_SERVER_URL as string) || "/api/token?";
  const LIVEKIT_WS = (import.meta.env.VITE_LIVEKIT_WS_URL as string) || "ws://localhost:7880";

  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track: Track) => {
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        document.body.appendChild(el);
      }
    };

    const handleTrackUnsubscribed = (track: Track) => {
      if (track.kind === Track.Kind.Audio) {
        track.detach().forEach((el) => el.remove());
      }
    };

    room.on("trackSubscribed", handleTrackSubscribed);
    room.on("trackUnsubscribed", handleTrackUnsubscribed);

    return () => {
      room.off("trackSubscribed", handleTrackSubscribed);
      room.off("trackUnsubscribed", handleTrackUnsubscribed);
    };
  }, [room]);

  const getToken = async (roomName: string, userId: string) => {
    const base = TOKEN_SERVER_BASE.endsWith("?") ? TOKEN_SERVER_BASE : TOKEN_SERVER_BASE + "?";
    const url = `${base}room=${encodeURIComponent(roomName)}&user=${encodeURIComponent(userId)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Token fetch failed ${resp.status}`);
    const data = await resp.json();
    return data.token as string;
  };

  const connectToRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = `farmer-${Math.random().toString(36).substring(2, 8)}`;
      const roomName = "farm-support-room";

      const token = await getToken(roomName, userId);

      const newRoom = new Room();
      await newRoom.connect(LIVEKIT_WS, token);

      setRoom(newRoom);
      setConnected(true);

      const micTrack = await createLocalAudioTrack();
      await newRoom.localParticipant.publishTrack(micTrack);
      
      toast({
        title: "Connected successfully",
        description: "You are now connected to an AI voice agent",
      });
    } catch (err) {
      console.error("Error connecting to Agent:", err);
      setError("Failed to start voice call. Please check your microphone permissions.");
      toast({
        title: "Connection failed",
        description: "Could not connect to the voice agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectFromRoom = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setConnected(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="relative mb-6">
            {onBack && (
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="absolute -top-2 -left-2 flex items-center gap-2 text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="text-center space-y-4">
            <CardTitle className="text-3xl font-bold text-primary">
              AI Voice Assistant
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Talk to our AI-powered Krishi Sahayak for farming advice and support
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription className="text-center">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {connected ? (
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-75"></div>
                  <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
              )}
            </div>

            {!connected ? (
              <Button
                size="lg"
                onClick={connectToRoom}
                disabled={loading}
                className="w-full text-lg font-semibold py-6 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                    <span>Start Voice Call</span>
                  </div>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={disconnectFromRoom}
                className="w-full text-lg font-semibold py-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  <span>End Call</span>
                </div>
              </Button>
            )}

            {connected && (
              <div className="text-center space-y-3 bg-primary/5 rounded-lg p-4 w-full">
                <CardDescription className="text-lg font-semibold text-primary">
                  Call in Progress
                </CardDescription>
                <p className="text-sm text-muted-foreground/80 font-medium">
                  Speak clearly into your microphone
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
