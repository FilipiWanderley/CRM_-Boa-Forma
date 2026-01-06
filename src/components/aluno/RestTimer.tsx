import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  onClose?: () => void;
  autoStart?: boolean;
  className?: string;
}

// Sound notification using Web Audio API
function playNotificationSound(type: 'tick' | 'complete' | 'warning') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'complete':
        // Triple beep for completion
        oscillator.frequency.value = 880; // A5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.35);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
        
        oscillator.stop(audioContext.currentTime + 0.7);
        break;
      
      case 'warning':
        // Single beep for 3-second warning
        oscillator.frequency.value = 660; // E5
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
      
      case 'tick':
        // Subtle tick for last 3 seconds
        oscillator.frequency.value = 440; // A4
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
    }
  } catch (e) {
    console.log('Audio not supported');
  }
}

export function RestTimer({ 
  initialSeconds, 
  onComplete, 
  onClose,
  autoStart = true,
  className 
}: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isMuted, setIsMuted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const reset = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setIsComplete(false);
    setIsRunning(false);
  }, [totalSeconds]);

  const adjustTime = (delta: number) => {
    const newTotal = Math.max(10, totalSeconds + delta);
    setTotalSeconds(newTotal);
    if (!isRunning) {
      setSecondsLeft(newTotal);
    }
  };

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const newValue = prev - 1;
          
          // Sound effects
          if (!isMuted) {
            if (newValue === 3 || newValue === 2 || newValue === 1) {
              playNotificationSound('tick');
            }
            if (newValue === 0) {
              playNotificationSound('complete');
            }
          }
          
          return newValue;
        });
      }, 1000);
    } else if (secondsLeft === 0 && !isComplete) {
      setIsComplete(true);
      setIsRunning(false);
      onComplete?.();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsLeft, isMuted, isComplete, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getTimerColor = () => {
    if (isComplete) return 'text-success';
    if (secondsLeft <= 3) return 'text-destructive animate-pulse';
    if (secondsLeft <= 10) return 'text-amber-500';
    return 'text-primary';
  };

  const getProgressColor = () => {
    if (isComplete) return 'bg-success';
    if (secondsLeft <= 3) return 'bg-destructive';
    if (secondsLeft <= 10) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all duration-300',
      isComplete && 'ring-2 ring-success ring-offset-2',
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>Descanso</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-4">
          <div className={cn(
            'text-5xl font-mono font-bold transition-colors duration-300',
            getTimerColor()
          )}>
            {formatTime(secondsLeft)}
          </div>
          {isComplete && (
            <p className="text-sm text-success mt-1 animate-fade-in">
              Hora de voltar! 💪
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-1000 ease-linear rounded-full',
                getProgressColor()
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {/* Decrease Time */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => adjustTime(-10)}
            disabled={totalSeconds <= 10}
          >
            <Minus className="h-4 w-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            variant={isComplete ? 'secondary' : 'default'}
            size="lg"
            className={cn(
              'h-12 w-12 rounded-full transition-all',
              isComplete && 'bg-success hover:bg-success/90 text-success-foreground',
              isRunning && 'animate-pulse'
            )}
            onClick={() => {
              if (isComplete) {
                reset();
                setIsRunning(true);
              } else {
                setIsRunning(!isRunning);
              }
            }}
          >
            {isComplete ? (
              <RotateCcw className="h-5 w-5" />
            ) : isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Increase Time */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => adjustTime(10)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Reset */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={reset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {[30, 60, 90, 120].map((secs) => (
            <Button
              key={secs}
              variant={totalSeconds === secs ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setTotalSeconds(secs);
                setSecondsLeft(secs);
                setIsComplete(false);
              }}
            >
              {secs < 60 ? `${secs}s` : `${secs / 60}min`}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline timer for exercise cards
interface InlineRestTimerProps {
  seconds: number;
  onStart?: () => void;
  className?: string;
}

export function InlineRestTimer({ seconds, onStart, className }: InlineRestTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          const newValue = prev - 1;
          if (!isMuted && newValue <= 3 && newValue > 0) {
            playNotificationSound('tick');
          }
          if (!isMuted && newValue === 0) {
            playNotificationSound('complete');
          }
          return newValue;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (secondsLeft === 0) {
      setIsActive(false);
    }
  }, [isActive, secondsLeft, isMuted]);

  const handleStart = () => {
    setSecondsLeft(seconds);
    setIsActive(true);
    onStart?.();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return mins > 0 ? `${mins}:${remaining.toString().padStart(2, '0')}` : `${secs}s`;
  };

  if (!isActive && secondsLeft === seconds) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-1.5', className)}
        onClick={handleStart}
      >
        <Timer className="h-3.5 w-3.5" />
        {formatTime(seconds)}
      </Button>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
      secondsLeft === 0 
        ? 'bg-success/20 text-success' 
        : secondsLeft <= 3 
          ? 'bg-destructive/20 text-destructive animate-pulse'
          : 'bg-primary/20 text-primary',
      className
    )}>
      <Timer className="h-3.5 w-3.5" />
      <span className="font-mono font-bold text-sm">
        {secondsLeft === 0 ? 'GO!' : formatTime(secondsLeft)}
      </span>
      {secondsLeft > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0"
          onClick={() => {
            setIsActive(false);
            setSecondsLeft(seconds);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      {secondsLeft === 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0"
          onClick={handleStart}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
