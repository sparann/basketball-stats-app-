import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const EditPlayerModal = ({ player, onClose, onSave }) => {
  const [playerName, setPlayerName] = useState(player.name);
  const [pictureUrl, setPictureUrl] = useState(player.pictureUrl || '');
  const [height, setHeight] = useState(player.height || '');
  const [weight, setWeight] = useState(player.weight || '');
  const [injured, setInjured] = useState(player.injured || false);
  const [uploading, setUploading] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      if (!isSupabaseConfigured()) {
        alert('Supabase is not configured');
        setUploading(false);
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `player-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('basketball-stats')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('basketball-stats')
        .getPublicUrl(filePath);

      setPictureUrl(urlData.publicUrl);
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload image');
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...player,
      name: playerName.trim(),
      pictureUrl: pictureUrl.trim(),
      height: height.trim(),
      weight: weight.trim(),
      injured
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Edit Player</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture - Clickable */}
          <div className="flex flex-col items-center gap-3">
            <label className="cursor-pointer group relative">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {pictureUrl ? (
                <img
                  src={pictureUrl}
                  alt={playerName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 group-hover:border-blue-300 transition-colors"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-3xl font-bold border-4 border-slate-100 group-hover:border-blue-300 transition-colors">
                  {getInitials(playerName)}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? 'Uploading...' : 'Click to upload'}
                </span>
              </div>
            </label>
          </div>

          {/* Player Name */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Height */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
              Height (Optional)
            </label>
            <input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g., 6'2&quot;"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
              Weight (Optional)
            </label>
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 180 lbs"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Injured Status */}
          <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer p-4 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              checked={injured}
              onChange={(e) => setInjured(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="font-semibold">Mark as injured</span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlayerModal;
