import React, { useState, useEffect } from 'react';

import { engine } from '../utils/audioEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  padId: number | null;
  currentYtId: string;
  onSetYtId: (id: string) => void;
  onSetSpeed: (speed: number) => void;
  onSetTrim: (start: number, end: number) => void;
  onClearPad: () => void;
}

const PadEditor: React.FC<Props> = ({ isOpen, onClose, padId, currentYtId, onSetYtId, onSetSpeed, onSetTrim, onClearPad }) => {
  const [vol, setVol] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [startPercent, setStartPercent] = useState(0);
  const [endPercent, setEndPercent] = useState(100);
  const [ytLink, setYtLink] = useState('');
  const [distortion, setDistortion] = useState(0);
  const [delay, setDelay] = useState(0);
  const [reverb, setReverb] = useState(0);
  const [chokeGroup, setChokeGroup] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && padId !== null) {
      const state = engine.getPadSettings(padId);
      setVol(state?.volume || 0);
      setPitch(state?.pitch || 0);
      setSpeed(state?.speed || 1);
      setStartPercent(state?.startPercent || 0);
      setEndPercent(state?.endPercent ?? 100);
      setDistortion(state?.distortion || 0);
      setDelay(state?.delay || 0);
      setReverb(state?.reverb || 0);
      setChokeGroup(state?.chokeGroup || null);
      setYtLink('');
    }
  }, [isOpen, padId]);

  if (!isOpen || padId === null) return null;

  const handleVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVol(v);
    engine.updatePadSettings(padId, { volume: v });
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = Number(e.target.value);
    setPitch(p);
    engine.updatePadSettings(padId, { pitch: p });
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = Number(e.target.value);
    setSpeed(s);
    engine.updatePadSettings(padId, { speed: s });
    onSetSpeed(s);
  };

  const handleYtSubmit = () => {
     const match = ytLink.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
     if (match && match[1]) {
         onSetYtId(match[1]);
     } else if (ytLink.length === 11) {
         onSetYtId(ytLink);
     }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="w-full max-w-sm bg-retro-panel shadow-retro-thick p-1 flex flex-col rounded-t-lg border-2 border-[#b91c1c]">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center w-full mb-2 bg-gradient-to-r from-[#b91c1c] via-[#ef4444] to-[#b91c1c] text-white p-1.5 px-3 rounded-t-[6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <h2 className="text-xs font-bold font-sans tracking-widest drop-shadow-[1px_1px_1px_rgba(0,0,0,0.6)]">PAD SETTINGS {padId !== null ? padId + 1 : ''}</h2>
          <button 
            onClick={onClose} 
            className="w-5 h-5 flex items-center justify-center bg-[#ef4444] hover:bg-[#dc2626] active:bg-[#991b1b] border border-[#f87171] text-white font-extrabold text-[10px] rounded-[3px] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4)]"
            style={{ textShadow: '0 1px 0 rgba(0,0,0,0.5)' }}
          >
            X
          </button>
        </div>

        <div className="p-2 flex flex-col gap-4">
          
          {/* Audio Source (Youtube) */}
          <div className="w-full bg-retro-bg shadow-retro-inset p-2 border border-retro-border-dark">
              <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-retro-text">YouTube Source</span>
              </div>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Coller l'URL YouTube ici..." 
                    className="flex-1 bg-white border border-retro-border-dark text-black text-xs p-1 focus:outline-none"
                    value={ytLink}
                    onChange={(e) => setYtLink(e.target.value)}
                  />
                  <button 
                    onClick={handleYtSubmit}
                    className="bg-retro-panel shadow-retro-outset active:shadow-retro-inset active:translate-y-[1px] px-3 text-xs font-bold"
                  >
                    LOAD
                  </button>
              </div>
              {currentYtId && <span className="text-[10px] text-brand-red font-bold mt-1 block">Video Loaded: {currentYtId}</span>}
          </div>
          
          <button 
            onClick={() => {
               onClearPad();
               onClose();
            }}
            className="bg-retro-panel shadow-retro-outset active:shadow-retro-inset active:translate-y-[1px] text-brand-red font-bold py-1 text-xs"
          >
            CLEAR PAD
          </button>

          {/* Waveform / Trim Area */}
          <div className="w-full bg-retro-bg shadow-retro-inset p-2 border border-retro-border-dark">
             <div className="flex justify-between items-center w-full">
                <span className="text-retro-text font-bold text-[10px] uppercase">Sample Start Point</span>
                <span className="text-brand-red font-bold text-[10px]">{startPercent}%</span>
             </div>
             <input 
                type="range" 
                className="custom-slider w-full mt-1 mb-2" 
                min="0" max="99" 
                value={startPercent} 
                onChange={(e) => {
                   const val = Number(e.target.value);
                   if (val >= endPercent) return;
                   setStartPercent(val);
                   engine.updatePadSettings(padId!, { startPercent: val });
                   onSetTrim(val, endPercent);
                }} 
             />
             
             <div className="flex justify-between items-center w-full">
                <span className="text-retro-text font-bold text-[10px] uppercase">Sample End Point</span>
                <span className="text-brand-red font-bold text-[10px]">{endPercent}%</span>
             </div>
             <input 
                type="range" 
                className="custom-slider w-full mt-1" 
                min="1" max="100" 
                value={endPercent} 
                onChange={(e) => {
                   const val = Number(e.target.value);
                   if (val <= startPercent) return;
                   setEndPercent(val);
                   engine.updatePadSettings(padId!, { endPercent: val });
                   onSetTrim(startPercent, val);
                }} 
             />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-retro-bg shadow-retro-inset p-2 border border-retro-border-dark flex flex-col gap-1">
               <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase text-retro-text">Volume</span>
                  <span className="text-[10px] font-bold text-brand-red">{vol} dB</span>
               </div>
               <input type="range" className="custom-slider" min="-60" max="0" value={vol} onChange={handleVolChange} />
             </div>

             <div className="bg-retro-bg shadow-retro-inset p-2 border border-retro-border-dark flex flex-col gap-1">
               <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase text-retro-text">Pitch</span>
                  <span className="text-[10px] font-bold text-brand-red">{pitch > 0 ? `+${pitch}` : pitch} st</span>
               </div>
               <input type="range" className="custom-slider" min="-12" max="12" value={pitch} onChange={handlePitchChange} />
               {currentYtId && <span className="text-[8px] text-brand-red font-bold leading-none">N/A FOR YT</span>}
             </div>

             <div className="bg-retro-bg shadow-retro-inset p-2 border border-retro-border-dark flex flex-col gap-1 col-span-2">
               <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase text-retro-text">Speed (Rate)</span>
                  <span className="text-[10px] font-bold text-brand-red">x{speed}</span>
               </div>
               <input type="range" className="custom-slider" min="0.25" max="2" step="0.05" value={speed} onChange={handleSpeedChange} />
             </div>
          </div>
           {/* Effects */}
           <div className="bg-retro-bg shadow-retro-inset p-2 border border-retro-border-dark flex flex-col gap-2 col-span-2">
             <span className="text-[10px] font-bold uppercase text-retro-text">Effects</span>
             
             <div className="flex justify-between items-center gap-2">
                 <span className="text-[10px] font-bold text-retro-text w-16">Distortion</span>
                 <input type="range" className="custom-slider flex-1" min="0" max="1" step="0.01" value={distortion} onChange={(e) => {
                     const v = Number(e.target.value); setDistortion(v); engine.updatePadSettings(padId!, { distortion: v });
                 }} />
             </div>
             <div className="flex justify-between items-center gap-2">
                 <span className="text-[10px] font-bold text-retro-text w-16">Delay</span>
                 <input type="range" className="custom-slider flex-1" min="0" max="1" step="0.01" value={delay} onChange={(e) => {
                     const v = Number(e.target.value); setDelay(v); engine.updatePadSettings(padId!, { delay: v });
                 }} />
             </div>
             <div className="flex justify-between items-center gap-2">
                 <span className="text-[10px] font-bold text-retro-text w-16">Reverb</span>
                 <input type="range" className="custom-slider flex-1" min="0" max="1" step="0.01" value={reverb} onChange={(e) => {
                     const v = Number(e.target.value); setReverb(v); engine.updatePadSettings(padId!, { reverb: v });
                 }} />
             </div>
           </div>

           {/* Choke Group */}
           <div className="bg-retro-bg shadow-retro-inset p-2 border border-retro-border-dark flex justify-between items-center col-span-2">
              <span className="text-[10px] font-bold uppercase text-retro-text">Choke Group</span>
              <select 
                 className="bg-retro-panel text-xs p-1 outline-none border border-retro-border-dark font-mono font-bold"
                 value={chokeGroup === null ? '' : chokeGroup}
                 onChange={(e) => {
                     const v = e.target.value === '' ? null : Number(e.target.value);
                     setChokeGroup(v);
                     engine.updatePadSettings(padId!, { chokeGroup: v });
                 }}
              >
                  <option value="">None</option>
                  <option value="1">Group A</option>
                  <option value="2">Group B</option>
                  <option value="3">Group C</option>
                  <option value="4">Group D</option>
              </select>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PadEditor;
