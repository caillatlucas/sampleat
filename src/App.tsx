import { useState, useEffect } from 'react';
import DrumMachine from './components/DrumMachine';
import MasterControls from './components/MasterControls';
import MelodyMaker from './components/MelodyMaker';
import DrumSequencer from './components/DrumSequencer';
import Visualizer from './components/Visualizer';

function App() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'pads' | 'sequencer' | 'melody'>('pads');
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [tempBpm, setTempBpm] = useState('120');

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-retro-bg flex flex-col items-center pb-8 font-sans">
      {/* TOP BAR / VISUALIZER */}
      <div className="w-full h-20 bg-mpc-top border-b-4 border-mpc-blue flex items-center justify-center p-2 mb-6">
         <div className="flex-1 max-w-4xl h-full opacity-90">
            <Visualizer />
         </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col gap-6 px-4">
         
         {/* HEADER (Logo, Title, Master Controls) */}
         <header className="w-full flex items-center justify-between bg-retro-panel p-4 shadow-retro-outset border-2 border-retro-border-dark">
            <div className="flex items-center gap-3">
               <img src="/apple-logo.png" alt="Logo" className="w-12 h-12 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]" />
               <h1 className="text-4xl font-black tracking-tighter text-retro-text" style={{ textShadow: '2px 2px 0 #a3a098' }}>SAMPLEAT</h1>
               <div className="flex flex-col justify-end h-full pb-1 ml-2">
                 <span className="text-[10px] font-bold font-mono tracking-widest text-retro-text">2026 by IG:lc.20ytb</span>
                 <span className="text-[10px] font-bold font-mono text-gray-600">MPC 2000 XL EDITION</span>
               </div>
            </div>
            
            <div className="flex-1 flex justify-end">
               <MasterControls bpm={bpm} setBpm={setBpm} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
            </div>
         </header>

         {/* MAIN SPLIT LAYOUT */}
         <div className="w-full flex gap-6">
            
            {/* LEFT PANEL (LCD & TABS) */}
            <div className="w-80 bg-retro-panel p-6 shadow-retro-outset border-2 border-retro-border-dark flex flex-col">
               
               {/* LCD SCREEN */}
               <div className="bg-mpc-lcd-bg w-full h-32 rounded-sm shadow-retro-inset border-4 border-retro-border-dark p-4 flex flex-col justify-between mb-8">
                  <div className="text-mpc-lcd-text font-mono font-bold text-2xl tracking-widest">{activeTab.toUpperCase()}</div>
                  <div className="text-mpc-lcd-text font-mono text-sm opacity-90">SAMPLEAT STUDIO</div>
                  <div className="flex justify-between items-end">
                     {isEditingBpm ? (
                        <div className="flex items-center gap-1">
                           <span className="text-mpc-lcd-text font-mono text-xs opacity-70">BPM:</span>
                           <input 
                             type="number" 
                             className="w-14 bg-[#0a1f07] text-mpc-lcd-text font-mono text-xs border border-mpc-lcd-text focus:outline-none p-0.5"
                             value={tempBpm}
                             onChange={(e) => setTempBpm(e.target.value)}
                             onBlur={saveBpm}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') saveBpm();
                             }}
                             autoFocus
                             min="60"
                             max="240"
                           />
                        </div>
                     ) : (
                        <div 
                          onClick={() => setIsEditingBpm(true)}
                          className="text-mpc-lcd-text font-mono text-xs opacity-70 cursor-pointer hover:underline"
                          title="Cliquez pour modifier le BPM"
                        >
                           BPM: {bpm}
                        </div>
                     )}
                     <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></div>
                  </div>
               </div>

               {/* TAB BUTTONS (MPC Style) */}
               <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-retro-text mb-2">MODE SELECT</span>
                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       className={`h-12 shadow-retro-outset font-bold text-[10px] text-white flex items-center justify-center border border-retro-border-dark transition-transform ${activeTab === 'pads' ? 'bg-mpc-blue translate-y-[2px] shadow-retro-inset' : 'bg-mpc-blue hover:brightness-110'}`}
                       onClick={() => setActiveTab('pads')}
                     >
                       DRUM PADS
                     </button>
                     <button 
                       className={`h-12 shadow-retro-outset font-bold text-[10px] text-white flex items-center justify-center border border-retro-border-dark transition-transform ${activeTab === 'sequencer' ? 'bg-mpc-blue translate-y-[2px] shadow-retro-inset' : 'bg-mpc-blue hover:brightness-110'}`}
                       onClick={() => setActiveTab('sequencer')}
                     >
                       SEQUENCER
                     </button>
                     <button 
                       className={`col-span-2 h-12 shadow-retro-outset font-bold text-[10px] text-white flex items-center justify-center border border-retro-border-dark transition-transform ${activeTab === 'melody' ? 'bg-mpc-blue translate-y-[2px] shadow-retro-inset' : 'bg-mpc-blue hover:brightness-110'}`}
                       onClick={() => setActiveTab('melody')}
                     >
                       MELODY MAKER
                     </button>
                  </div>
               </div>
            </div>

            {/* RIGHT PANEL (CONTENT AREA) */}
            <div className="flex-1 bg-mpc-green p-6 shadow-retro-outset border-2 border-retro-border-dark">
               <div className={activeTab === 'pads' ? 'block' : 'hidden'}>
                  <DrumMachine />
               </div>
               <div className={activeTab === 'sequencer' ? 'block' : 'hidden'}>
                  <DrumSequencer />
               </div>
               <div className={activeTab === 'melody' ? 'block' : 'hidden'}>
                  <MelodyMaker />
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}

export default App;
