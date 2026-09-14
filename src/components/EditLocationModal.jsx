import { useState, useEffect } from 'react';

const EditLocationModal = ({ location, onClose, onSave }) => {
  const isEditing = !!location;
  const [locationName, setLocationName] = useState(location || '');

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (locationName.trim()) {
      onSave(locationName.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-line">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink">
              {isEditing ? 'Edit Location' : 'Add New Location'}
            </h2>
            <button
              onClick={onClose}
              className="text-ink-3 hover:text-ink text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Location Name */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink uppercase tracking-wide">
              Location Name
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g., Main Gym, Court A"
              className="w-full px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
              required
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-5 py-3 bg-accent text-accent-ink rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              {isEditing ? 'Save Changes' : 'Add Location'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-surface-2 text-ink rounded-xl font-semibold hover:bg-line-strong transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLocationModal;
