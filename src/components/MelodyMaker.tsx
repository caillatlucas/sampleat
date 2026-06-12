import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Download } from 'lucide-react';
import * as Tone from 'tone';
import { engine } from '../utils/audioEngine';

const NOTES = ['C5', 'A4', 'G4', 'E4', 'D4', 'C4'];

const MelodyMaker: React.FC = () => {
  const [grid, setGrid] = useState<boolean[][]>(
    Array(NOTES.length).fill(null).map(() => Array(16).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [targetPad, setTargetPad] = useState<number>(0);
  const [oscType, setOscType] = useState<"sine" | "square" | "triangle" | "sawtooth">("sine");
  const [sampleBuffer, setSampleBuffer] = useState<Tone.ToneAudioBuffer | null>(null);
  
  const synthRef = useRef<Tone.PolySynth | Tone.Sampler | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    if (sampleBuffer) return; // Managed by upload handler
    
    if (synthRef.current) {
        synthRef.current.dispose();
    }
    
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscType },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 1 }
    }).toDestination();
  }, [oscType, sampleBuffer]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      sequenceRef.current?.dispose();
    };
  }, []);

  const toggleCell = async (row: number, col: number) => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    const newGrid = grid.map((r, rIdx) => 
      r.map((c, cIdx) => {
          if (rIdx === row && cIdx === col) {
              const isActive = !c;
              if (isActive && synthRef.current) {
                  try {
                      synthRef.current.triggerAttackRelease(NOTES[row], "16n");
                  } catch (e) {
                      console.error("Sampler error", e);
                  }
              }
              return isActive;
          }
          return c;
      })
    );
    setGrid(newGrid);
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
        
        const notesToPlay: string[] = [];
        grid.forEach((row, rIdx) => {
          if (row[step as number]) notesToPlay.push(NOTES[rIdx]);
        });
        
        if (notesToPlay.length > 0) {
          synthRef.current?.triggerAttackRelease(notesToPlay, "16n", time);
        }
      }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], "16n");

      Tone.Transport.start();
      sequenceRef.current.start(0);
      setIsPlaying(true);
    }
  };

  const clearGrid = () => {
    setGrid(Array(NOTES.length).fill(Array(16).fill(false)));
  };

  const renderToPad = async () => {
    const bpm = Tone.Transport.bpm.value || 120;
    // duration of 16 steps of 16th notes
    const duration = (16 * 60) / (bpm * 4);
    
    const buffer = await Tone.Offline(({ transport }) => {
      let offlineSynth: Tone.PolySynth | Tone.Sampler;
      
      if (sampleBuffer) {
          offlineSynth = new Tone.Sampler({
              urls: { C4: sampleBuffer }
          }).toDestination();
      } else {
          offlineSynth = new Tone.PolySynth(Tone.Synth, {
              oscillator: { type: oscType },
              envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 1 }
          }).toDestination();
      }
      
      grid.forEach((row, rIdx) => {
        row.forEach((isActive, colIdx) => {
          if (isActive) {
            const time = (colIdx * 60) / (bpm * 4);
            offlineSynth.triggerAttackRelease(NOTES[rIdx], "16n", time);
          }
        });
      });
      
      transport.bpm.value = bpm;
    }, duration);

    engine.setBuffer(targetPad, buffer);
    if ((window as any).triggerPadUpdate) {
        (window as any).triggerPadUpdate(targetPad);
    }
    alert(`Melody rendered to Pad ${targetPad + 1}!`);
  };

  return (
    <div className="p-4 bg-retro-panel shadow-retro-inset border-2 border-retro-border-dark flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-widest text-brand-red font-mono">MELODY MAKER</h2>
        <div className="flex gap-2 items-center">
           {!sampleBuffer && (
             <select 
               value={oscType}
               onChange={(e) => {
                   const type = e.target.value as "sine" | "square" | "triangle" | "sawtooth";
                   setOscType(type);
               }}
               className="bg-retro-bg border-2 border-retro-border-dark px-2 py-1 text-sm font-mono outline-none uppercase text-retro-text"
             >
               <option value="sine">SINE</option>
               <option value="square">SQUARE</option>
               <option value="triangle">TRIANGLE</option>
               <option value="sawtooth">SAWTOOTH</option>
             </select>
           )}
           {sampleBuffer && (
               <button 
                 onClick={() => { setSampleBuffer(null); }}
                 className="px-2 py-1 bg-retro-panel border border-brand-red text-brand-red text-xs font-bold shadow-retro-outset active:shadow-retro-inset"
               >
                 CLEAR SAMPLE
               </button>
           )}
           <label className="px-3 py-1 bg-retro-panel border-2 border-retro-border-dark shadow-retro-outset active:shadow-retro-inset active:translate-y-[2px] text-xs font-bold font-mono cursor-pointer flex items-center">
               UPLOAD SAMPLE
               <input 
                 type="file" 
                 accept="audio/*" 
                 className="hidden"
                 onChange={(e) => {
                    if (e.target.files?.length) {
                       const url = URL.createObjectURL(e.target.files[0]);
                       const buff = new Tone.ToneAudioBuffer(url, () => {
                           setSampleBuffer(buff);
                           if (synthRef.current) synthRef.current.dispose();
                           synthRef.current = new Tone.Sampler({ urls: { C4: buff } }).toDestination();
                       });
                    }
                 }}
               />
           </label>
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
        {NOTES.map((note, rIdx) => (
          <div key={note} className="flex gap-1 items-center">
            <div className="w-8 text-xs font-mono font-bold text-retro-text">{note}</div>
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

      <div className="mt-4 flex items-center justify-between border-t-2 border-retro-border-dark pt-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold font-mono uppercase">Target Pad:</label>
          <select 
            value={targetPad} 
            onChange={(e) => setTargetPad(parseInt(e.target.value))}
            className="bg-retro-bg border-2 border-retro-border-dark px-2 py-1 text-sm font-mono outline-none"
          >
            {Array(16).fill(0).map((_, i) => (
              <option key={i} value={i}>Pad {i + 1}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={renderToPad}
          className="px-4 py-2 bg-retro-panel border-2 border-retro-border-dark shadow-retro-outset active:shadow-retro-inset active:translate-y-[2px] flex items-center gap-2 text-sm font-bold uppercase font-mono"
        >
          <Download size={14} /> Render to Pad
        </button>
      </div>
    </div>
  );
};

export default MelodyMaker;
