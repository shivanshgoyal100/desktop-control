import React from "react";

const Card = ({ title, value, subtext, icon, trend }) => {
  return (
    <div className="bg-card border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-muted text-sm font-medium">{title}</h3>
        <div className="p-2 bg-slate-900 rounded-lg text-accent group-hover:shadow-glow transition-all">
          {icon}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-white mb-1">{value}</span>
        <span className={`text-xs ${trend?.includes('+') ? 'text-success' : 'text-muted'}`}>
          {subtext}
        </span>
      </div>
    </div>
  );
};

export default Card;