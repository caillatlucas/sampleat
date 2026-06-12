import React, { useRef, useEffect } from 'react';
import { Play, Square, Activity, OctagonX } from 'lucide-react';
import { engine } from '../utils/audioEngine';

interface Props {
  bpm: number;
  setBpm: (bpm: number) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
}

const MasterControls: React.FC<Props> = ({ bpm, setBpm, isPlaying, setIsPlaying }) => {
  const lastTap = useRef<number>(0);
  const [filter, setFilter] = React.useState(20000);
  const [isEditingBpm, setIsEditingBpm] = React.useState(false);
  const [tempBpm, setTempBpm] = React.useState(bpm.toString());

  useEffect(() => {
     engine.setBpm(bpm);
     setTempBpm(bpm.toString());
  }, [bpm]);

  const saveBpm = () => {
     setIsEditingBpm(false);
     const val = Number(tempBpm);
     if (!isNaN(val) && val >= 60 && val <= 240) {
        setBpm(val);
     } else {
        setTempBpm(bpm.toString());
     }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    if (lastTap.current) {
      const diff = now - lastTap.current;
      const calculatedBpm = Math.round(60000 / diff);
      if (calculatedBpm >= 60 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
      }
    }
    lastTap.current = now;
  };

  return (
    <div className="w-full p-4 mb-4 bg-retro-panel shadow-retro-outset flex flex-wrap items-center justify-between gap-4">
      {/* BPM Control */}
      <div className="flex items-center gap-4 p-2 bg-retro-bg shadow-retro-inset flex-1 min-w-[200px]">
        <span className="text-xs font-bold uppercase tracking-widest text-retro-text w-8">BPM</span>
        <input 
          type="range" 
          min="60" 
          max="200" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))}
          className="custom-slider flex-1"
        />
        
        {isEditingBpm ? (
          <input 
            type="number"
            value={tempBpm}
            onChange={(e) => setTempBpm(e.target.value)}
            onBlur={saveBpm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveBpm();
            }}
            className="w-12 bg-white text-black font-bold font-mono text-sm text-right border border-retro-border-dark p-0.5 focus:outline-none"
            autoFocus
            min="60"
            max="240"
          />
        ) : (
          <span 
            onClick={() => setIsEditingBpm(true)}
            className="text-brand-red font-bold font-mono text-sm w-8 text-right cursor-pointer hover:underline"
            title="Cliquez pour modifier le BPM"
          >
            {bpm}
          </span>
        )}
        
        <button 
          className="px-3 py-1 bg-retro-panel shadow-retro-outset text-xs font-bold flex items-center gap-2 active:shadow-retro-inset active:translate-y-[1px]"
          onClick={handleTapTempo}
        >
          <Activity size={12} /> TAP
        </button>
      </div>

      {/* Master Filter */}
      <div className="flex items-center gap-4 p-2 bg-retro-bg shadow-retro-inset flex-1 min-w-[200px]">
        <span className="text-xs font-bold uppercase tracking-widest text-retro-text">FILTER</span>
        <input 
          type="range" 
          min="100" 
          max="20000" 
          step="100"
          value={filter} 
          onChange={(e) => {
              const val = Number(e.target.value);
              setFilter(val);
              engine.setMasterFilter(val);
          }}
          className="custom-slider flex-1"
        />
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-2 p-2 bg-retro-bg shadow-retro-inset">
        <button 
          onClick={() => {
             engine.stopAll();
             if (typeof (window as any).triggerGlobalStop === 'function') {
                (window as any).triggerGlobalStop();
             }
          }}
          className="w-10 h-10 flex items-center justify-center bg-retro-panel shadow-retro-outset active:shadow-retro-inset active:translate-y-[1px]"
          title="Panic / Stop All Audio"
        >
          <OctagonX size={18} className="text-brand-red" />
        </button>

        <button 
          onClick={async () => {
             const newPlayState = !isPlaying;
             setIsPlaying(newPlayState);
             engine.toggleTransport(newPlayState);
          }}
          className={`w-10 h-10 flex items-center justify-center bg-retro-panel ${isPlaying ? 'shadow-retro-inset' : 'shadow-retro-outset active:shadow-retro-inset active:translate-y-[1px]'}`}
          title="Play / Pause Metronome"
        >
          {isPlaying ? <Square size={18} className="text-brand-red" /> : <Play size={18} className="text-retro-text" />}
        </button>
      </div>
    </div>
  );
};

export default MasterControls;
