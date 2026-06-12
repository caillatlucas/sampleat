import React, { useState, useEffect } from 'react';
import DrumPad from './DrumPad';
import PadEditor from './PadEditor';
import { engine } from '../utils/audioEngine';

// Raccourcis clavier physiques (indépendant de la langue)
const keyMap = [
  { label: '1', code: 'Digit1' }, { label: '2', code: 'Digit2' }, { label: '3', code: 'Digit3' }, { label: '4', code: 'Digit4' },
  { label: 'Q', code: 'KeyQ' }, { label: 'W', code: 'KeyW' }, { label: 'E', code: 'KeyE' }, { label: 'R', code: 'KeyR' },
  { label: 'A', code: 'KeyA' }, { label: 'S', code: 'KeyS' }, { label: 'D', code: 'KeyD' }, { label: 'F', code: 'KeyF' },
  { label: 'Z', code: 'KeyZ' }, { label: 'X', code: 'KeyX' }, { label: 'C', code: 'KeyC' }, { label: 'V', code: 'KeyV' }
];

const DrumMachine: React.FC = () => {
  const [editingPad, setEditingPad] = useState<number | null>(null);
  const [ytIds, setYtIds] = useState<string[]>(Array(16).fill(''));
  const [speeds, setSpeeds] = useState<number[]>(Array(16).fill(1));
  const [startPercents, setStartPercents] = useState<number[]>(Array(16).fill(0));
  const [endPercents, setEndPercents] = useState<number[]>(Array(16).fill(100));
  const [updateTriggers, setUpdateTriggers] = useState<number[]>(Array(16).fill(0));
  const [globalStopTrigger, setGlobalStopTrigger] = useState(0);

  useEffect(() => {
    (window as any).triggerGlobalStop = () => {
        setGlobalStopTrigger(prev => prev + 1);
    };
    (window as any).triggerPadUpdate = (padId: number) => {
        setUpdateTriggers(prev => {
            const next = [...prev];
            next[padId]++;
            return next;
        });
    };
    return () => { 
        delete (window as any).triggerGlobalStop; 
        delete (window as any).triggerPadUpdate; 
    };
  }, []);

  const handleClearPad = (index: number) => {
      engine.clearPad(index);
      
      const nextYt = [...ytIds];
      nextYt[index] = '';
      setYtIds(nextYt);

      const nextUpdate = [...updateTriggers];
      nextUpdate[index]++;
      setUpdateTriggers(nextUpdate);
  };

  const handleDrop = (sourceId: number, targetId: number, isCopy: boolean) => {
    if (sourceId === targetId) return;

    if (isCopy) {
       engine.copyPad(sourceId, targetId);
       
       const nextYt = [...ytIds]; nextYt[targetId] = nextYt[sourceId]; setYtIds(nextYt);
       const nextSp = [...speeds]; nextSp[targetId] = nextSp[sourceId]; setSpeeds(nextSp);
       const nextStart = [...startPercents]; nextStart[targetId] = nextStart[sourceId]; setStartPercents(nextStart);
       const nextEnd = [...endPercents]; nextEnd[targetId] = nextEnd[sourceId]; setEndPercents(nextEnd);
       
       const nextUpdate = [...updateTriggers]; nextUpdate[targetId]++; setUpdateTriggers(nextUpdate);
    } else {
       engine.movePad(sourceId, targetId);
       
       const nextYt = [...ytIds];
       const tempYt = nextYt[targetId]; nextYt[targetId] = nextYt[sourceId]; nextYt[sourceId] = tempYt;
       setYtIds(nextYt);
       
       const nextSp = [...speeds];
       const tempSp = nextSp[targetId]; nextSp[targetId] = nextSp[sourceId]; nextSp[sourceId] = tempSp;
       setSpeeds(nextSp);

       const nextStart = [...startPercents];
       const tempStart = nextStart[targetId]; nextStart[targetId] = nextStart[sourceId]; nextStart[sourceId] = tempStart;
       setStartPercents(nextStart);

       const nextEnd = [...endPercents];
       const tempEnd = nextEnd[targetId]; nextEnd[targetId] = nextEnd[sourceId]; nextEnd[sourceId] = tempEnd;
       setEndPercents(nextEnd);

       const nextUpdate = [...updateTriggers]; nextUpdate[targetId]++; nextUpdate[sourceId]++; setUpdateTriggers(nextUpdate);
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2 p-2 bg-retro-panel shadow-retro-inset border-2 border-retro-border-dark">
        {keyMap.map((keyInfo, index) => (
          <DrumPad 
            key={index} 
            id={index} 
            hotkey={keyInfo.label} 
            keyCode={keyInfo.code}
            youtubeId={ytIds[index]}
            updateTrigger={updateTriggers[index]}
            globalStopTrigger={globalStopTrigger}
            speed={speeds[index]}
            startPercent={startPercents[index]}
            endPercent={endPercents[index]}
            onEdit={() => setEditingPad(index)}
            onDropPad={(sourceId, isCopy) => handleDrop(sourceId, index, isCopy)}
          />
        ))}
      </div>
    <PadEditor 
       isOpen={editingPad !== null} 
       onClose={() => setEditingPad(null)} 
       padId={editingPad} 
       currentYtId={editingPad !== null ? ytIds[editingPad] : ''}
       onSetYtId={(ytId) => {
          if (editingPad !== null) {
             const next = [...ytIds];
             next[editingPad] = ytId;
             setYtIds(next);
          }
       }}
       onSetSpeed={(val) => {
          if (editingPad !== null) {
             const next = [...speeds];
             next[editingPad] = val;
             setSpeeds(next);
          }
       }}
       onSetTrim={(start, end) => {
          if (editingPad !== null) {
             const nS = [...startPercents]; nS[editingPad] = start; setStartPercents(nS);
             const nE = [...endPercents]; nE[editingPad] = end; setEndPercents(nE);
          }
       }}
       onClearPad={() => {
           if (editingPad !== null) {
               handleClearPad(editingPad);
           }
       }}
    />
    </>
  );
};

export default DrumMachine;
