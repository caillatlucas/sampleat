import React, { useState, useRef, useEffect } from 'react';
import { Upload, Settings, RefreshCcw, Square } from 'lucide-react';
import { engine } from '../utils/audioEngine';
import YouTube from 'react-youtube';

interface Props {
  id: number;
  hotkey: string;
  keyCode: string;
  youtubeId?: string;
  updateTrigger: number;
  globalStopTrigger: number;
  speed: number;
  startPercent: number;
  endPercent: number;
  onEdit: () => void;
  onDropPad: (sourceId: number, isCopy: boolean) => void;
}

const DrumPad: React.FC<Props> = ({ id, hotkey, keyCode, youtubeId, updateTrigger, globalStopTrigger, speed, startPercent, endPercent, onEdit, onDropPad }) => {
  const [isActive, setIsActive] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  
  const hasAudioRef = useRef(hasAudio);
  const ytPlayerRef = useRef<any>(null);
  const isLoopRef = useRef(isLoop);
  const ytTimeoutRef = useRef<any>(null);
  
  useEffect(() => { hasAudioRef.current = hasAudio; }, [hasAudio]);
  useEffect(() => { isLoopRef.current = isLoop; }, [isLoop]);

  useEffect(() => {
     if (updateTrigger > 0) {
        const settings = engine.getPadSettings(id);
        setHasAudio(settings.isLoaded);
        setIsLoop(settings.loop);
        if (!settings.isLoaded && ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
            ytPlayerRef.current.pauseVideo();
        }
     }
  }, [updateTrigger]);

  useEffect(() => {
     if (globalStopTrigger > 0) {
         setIsActive(false);
         if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
             ytPlayerRef.current.pauseVideo();
         }
     }
  }, [globalStopTrigger]);

  useEffect(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
          ytPlayerRef.current.setPlaybackRate(speed);
      }
  }, [speed]);

  // Gère l'effet de frappe visuelle et le son
  const triggerPad = () => {
    setIsActive(true);
    if (hasAudioRef.current) {
      engine.playPad(id);
    } else if (youtubeId && ytPlayerRef.current) {
      const dur = ytPlayerRef.current.getDuration() || 0;
      const startSec = (startPercent / 100) * dur;
      const endSec = (endPercent / 100) * dur;
      
      ytPlayerRef.current.seekTo(startSec);
      ytPlayerRef.current.playVideo();
      
      if (ytTimeoutRef.current) clearTimeout(ytTimeoutRef.current);
      if (endPercent < 100) {
          const playDurMs = ((endSec - startSec) * 1000) / speed;
          ytTimeoutRef.current = setTimeout(() => {
              if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
                  ytPlayerRef.current.pauseVideo();
              }
          }, playDurMs);
      }
    }
    setTimeout(() => setIsActive(false), 150);
  };

  // Keyboard binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === keyCode && !e.repeat) {
        triggerPad();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyCode]);
  return (
    <div 
      onMouseDown={triggerPad}
      draggable={true}
      onDragStart={(e) => {
         e.dataTransfer.setData('sourceId', id.toString());
         e.dataTransfer.effectAllowed = 'copyMove';
      }}
      onDragOver={(e) => {
         e.preventDefault();
         e.dataTransfer.dropEffect = e.altKey || e.ctrlKey ? 'copy' : 'move';
      }}
      onDrop={(e) => {
         e.preventDefault();
         const sourceIdStr = e.dataTransfer.getData('sourceId');
         if (sourceIdStr) {
            const sourceId = parseInt(sourceIdStr, 10);
            const isCopy = e.altKey || e.ctrlKey;
            onDropPad(sourceId, isCopy);
         }
      }}
      className={`
        relative aspect-square p-2 flex flex-col justify-between cursor-pointer select-none transition-none border border-retro-border-dark
        ${isActive ? 'bg-retro-bg shadow-retro-inset' : 'bg-retro-panel shadow-retro-outset'}
      `}
    >
      {/* Hotkey Badge */}
      <div className="absolute top-2 left-2 px-1 bg-retro-bg shadow-retro-inset flex items-center justify-center text-[10px] font-bold text-retro-text font-mono">
        {hotkey}
      </div>

      {/* Settings Icon */}
      <div 
        className="absolute top-1 right-1 p-1 bg-retro-bg rounded-sm border border-retro-border-dark cursor-pointer opacity-50 hover:opacity-100 hover:bg-brand-red hover:text-white z-30"
        onMouseDown={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Settings size={12} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center pointer-events-none mt-6">
        {(!hasAudio && !youtubeId) ? (
          <div className="flex flex-col items-center gap-1 opacity-50">
            <Upload size={16} />
            <span className="text-[10px] uppercase tracking-wider font-bold">Drop</span>
          </div>
        ) : (
          <div className={`w-10 h-10 flex items-center justify-center border border-retro-border-dark ${isActive ? 'bg-brand-red shadow-retro-inset text-white' : 'bg-retro-bg shadow-retro-inset text-brand-red'}`}>
             <span className="text-[10px] font-bold">RDY</span>
          </div>
        )}
      </div>

      {youtubeId && (
        <div className="hidden">
          <YouTube 
            videoId={youtubeId} 
            opts={{ playerVars: { autoplay: 0, controls: 0 } }} 
            onReady={(e) => { ytPlayerRef.current = e.target; }} 
            onStateChange={(e) => {
               // 0 is ENDED state
               if (e.data === 0 && isLoopRef.current) {
                  e.target.seekTo(0);
                  e.target.playVideo();
               }
            }}
          />
        </div>
      )}

      {/* Controls Area (if audio or youtube is present) */}
      {(hasAudio || youtubeId) && (
        <div 
          className="flex justify-between items-center mt-2 pointer-events-auto gap-1 z-20" 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => {
               engine.stopPad(id);
               if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
                   ytPlayerRef.current.pauseVideo();
               }
            }}
            className="p-1 bg-retro-panel shadow-retro-outset active:shadow-retro-inset active:translate-y-[1px]"
            title="Stop Pad"
          >
            <Square size={10} className="text-brand-red" />
          </button>
          
          <button 
            onClick={() => {
               const nextLoop = !isLoop;
               setIsLoop(nextLoop);
               if (hasAudioRef.current) {
                  engine.updatePadSettings(id, { loop: nextLoop });
               }
            }}
            className={`p-1 ml-auto active:translate-y-[1px] ${isLoop ? 'bg-retro-bg shadow-retro-inset text-brand-red' : 'bg-retro-panel shadow-retro-outset text-retro-text'}`}
            title="Toggle Loop"
          >
            <RefreshCcw size={10} />
          </button>
        </div>
      )}
      
      {/* Dummy file input to test visually */}
      {(!hasAudio && !youtubeId) && (
        <input 
          type="file" 
          accept="audio/*" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
          onChange={async (e) => {
            if (e.target.files?.length) {
              const file = e.target.files[0];
              await engine.loadSample(id, file);
              setHasAudio(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default DrumPad;
