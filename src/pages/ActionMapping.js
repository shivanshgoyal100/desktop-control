import React from 'react';
import { MousePointer, Zap, ShieldCheck, Volume2, PlayCircle } from 'lucide-react';

const ActionMapping = () => {
  const mappings = [
    { gesture: 'Palm_Open', action: 'Play/Pause', icon: <PlayCircle className="text-emerald-400" /> },
    { gesture: 'Thumb_Up', action: 'Volume Up', icon: <Volume2 className="text-indigo-400" /> },
    { gesture: 'Fist', action: 'Boss Key (Mute & Hide)', icon: <ShieldCheck className="text-red-400" /> },
    { gesture: 'Peace', action: 'Switch App', icon: <Zap className="text-amber-400" /> },
  ];

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
          <MousePointer size={24}/>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Action Mapping</h1>
          <p className="text-slate-500 text-sm">Link physical gestures to system commands</p>
        </div>
      </div>

      <div className="bg-[#161b22] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 border-b border-slate-800">
            <tr>
              <th className="p-6 text-slate-500 text-xs uppercase font-black tracking-widest">Gesture</th>
              <th className="p-6 text-slate-500 text-xs uppercase font-black tracking-widest">System Action</th>
              <th className="p-6 text-slate-500 text-xs uppercase font-black tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-white font-medium">
            {mappings.map((m) => (
              <tr key={m.gesture} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                <td className="p-6 font-bold text-lg">{m.gesture}</td>
                <td className="p-6">
                  <div className="flex items-center gap-3 text-indigo-300 font-semibold bg-indigo-500/5 w-fit px-4 py-2 rounded-xl border border-indigo-500/10">
                    {m.icon}
                    {m.action}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase font-black tracking-tighter">Mapped</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActionMapping;