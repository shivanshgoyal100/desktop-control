import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Fingerprint, Plus, RefreshCw, Loader2, RotateCcw } from 'lucide-react';

// Consistent list of system-provided gestures
const PRETRAINED_DEFAULTS = ["Swipe_Left", "Swipe_Right", "Palm_Open", "Fist", "Pointer", "Pinch"];

const Gestures = () => {
  const [gestures, setGestures] = useState([]);
  const [customGestures, setCustomGestures] = useState([]); // Track what's actually in CSV
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchGestures = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/gestures/list');
      const data = await res.json();
      
      // We expect the backend to return 'gestures' (all) and 'custom_gestures' (only from CSV)
      if (data.gestures) {
        setGestures(data.gestures);
        setCustomGestures(data.custom_gestures || []);
      } else {
        setGestures(PRETRAINED_DEFAULTS);
        setCustomGestures([]);
      }
    } catch (err) {
      console.error("Failed to connect to backend, loading defaults instead.");
      setGestures(PRETRAINED_DEFAULTS);
      setCustomGestures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGestures(); }, []);

  const handleAddNewGesture = () => {
    const name = prompt("Enter a unique name for the new gesture (e.g., 'Peace_Sign'):");
    if (name && name.trim() !== "") {
      const formattedName = name.trim().replace(/\s+/g, '_'); 
      navigate('/training', { state: { newGesture: formattedName } });
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete all data for "${name}"?`)) return;

    try {
      const response = await fetch(`http://localhost:8000/gestures/delete/${name}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.status === "success") {
        setGestures(prev => prev.filter(g => g !== name));
        setCustomGestures(prev => prev.filter(g => g !== name));
      } else {
        alert("Error: " + (data.message || "Could not delete"));
      }
    } catch (error) {
      // Optimistic UI update even if backend is unreachable
      setGestures(prev => prev.filter(g => g !== name));
      setCustomGestures(prev => prev.filter(g => g !== name));
    }
  };

  return (
    <div className="p-10 text-white min-h-screen bg-[#0d1117]">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Gesture Library</h1>
          <p className="text-gray-400 mt-2">Manage and view your system and custom gestures.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={fetchGestures} 
            className="flex items-center gap-2 bg-gray-800 text-gray-300 border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-700 transition-all"
          >
            <RotateCcw size={18} /><span>Refresh List</span>
          </button>

          <button 
            onClick={() => navigate('/training')} 
            className="flex items-center gap-2 bg-amber-600/10 text-amber-500 border border-amber-600/20 px-4 py-2 rounded-xl hover:bg-amber-600/20 transition-all"
          >
            <RefreshCw size={18} /><span>Retrain Model</span>
          </button>
          
          <button 
            onClick={handleAddNewGesture} 
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg"
          >
            <Plus size={20} /><span>Add New Gesture</span>
          </button>
        </div>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gestures.map((g) => {
            // Determine if this specific gesture is custom or pretrained
            const isCustom = customGestures.includes(g);
            
            return (
              <div key={g} className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 flex justify-between items-center group hover:border-indigo-500/50 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isCustom ? 'bg-purple-500/10' : 'bg-indigo-500/10'}`}>
                    <Fingerprint className={isCustom ? 'text-purple-500' : 'text-indigo-500'} />
                  </div>
                  <div>
                    <span className="text-xl font-medium block capitalize">
                      {g.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs font-semibold ${isCustom ? 'text-purple-400' : 'text-gray-500'}`}>
                      {isCustom ? "Custom Gesture" : "Pretrained System"}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(g)} 
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete Gesture"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && gestures.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-3xl">
          <p className="text-gray-500 text-lg">Your library is currently empty.</p>
          <p className="text-gray-600 text-sm mt-1">Add a new gesture to start building your dataset.</p>
        </div>
      )}
    </div>
  );
};

export default Gestures;