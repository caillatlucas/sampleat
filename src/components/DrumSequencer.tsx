import React, { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import * as Tone from 'tone';
import { engine } from '../utils/audioEngine';

const DrumSequencer: React.FC = () => {
  const [grid, setGrid] = useState<boolean[][]>(
    Array(16).fill(null).map(() => Array(16).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    return () => {
      sequenceRef.current?.dispose();
    };
  }, []);

  const toggleCell = async (row: number, col: number) => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    const newGrid = grid.map((r, rIdx) => 
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? !c : c))
    );
    setGrid(newGrid);
    
    if (!grid[row][col] && !isPlaying) {
        engine.playPad(row);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      sequenceRef.current?.stop();
      Tone.Transport.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    } else {
      await Tone.start();
      
      if (sequenceRef.current) {
         sequenceRef.current.dispose();
      }

      sequenceRef.current = new Tone.Sequence((time, step) => {
        Tone.Draw.schedule(() => setCurrentStep(step as number), time);
        
        grid.forEach((row, rIdx) => {
          if (row[step as number]) {
             engine.playPad(rIdx, time);
          }
        });
      }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], "16n");

      Tone.Transport.start();
      sequenceRef.current.start(0);
      setIsPlaying(true);
    }
  };

  const clearGrid = () => {
    setGrid(Array(16).fill(Array(16).fill(false)));
  };

  return (
    <div className="p-4 bg-retro-panel shadow-retro-inset border-2 border-retro-border-dark flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-widest text-brand-red font-mono">DRUM SEQUENCER</h2>
        <div className="flex gap-2">
           <button 
             onClick={togglePlay}
             className={`p-2 flex items-center justify-center border-2 border-retro-border-dark shadow-retro-outset active:shadow-retro-inset active:translate-y-[2px] ${isPlaying ? 'bg-brand-red text-white' : 'bg-retro-panel text-retro-text'}`}
           >
             {isPlaying ? <Square size={16} /> : <Play size={16} />}
           </button>
           <button 
             onClick={clearGrid}
             className="px-3 py-1 bg-retro-panel border-2 border-retro-border-dark shadow-retro-outset active:shadow-retro-inset active:translate-y-[2px] text-xs font-bold font-mono"
           >
             CLEAR
           </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 overflow-x-auto pb-2">
        {Array(16).fill(0).map((_, rIdx) => (
          <div key={rIdx} className="flex gap-1 items-center">
            <div className="w-12 text-[10px] font-mono font-bold text-retro-text">PAD {rIdx + 1}</div>
            {grid[rIdx].map((isActive, cIdx) => (
              <div 
                key={cIdx}
                onMouseDown={() => toggleCell(rIdx, cIdx)}
                className={`
                  w-8 h-8 flex-shrink-0 cursor-pointer border border-retro-border-dark
                  ${isActive ? 'bg-brand-red shadow-retro-inset' : 'bg-retro-bg shadow-retro-outset'}
                  ${currentStep === cIdx ? 'ring-2 ring-white opacity-80' : ''}
                `}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrumSequencer;
