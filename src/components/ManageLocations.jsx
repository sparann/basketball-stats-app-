import { useState } from 'react';
import EditLocationModal from './EditLocationModal';
import { useUI } from '../context/ui-context';

const ManageLocations = ({ locations, onAddLocation, onRemoveLocation, onEditLocation }) => {
  const { confirm } = useUI();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const handleSaveAdd = (locationName) => {
    if (onAddLocation) {
      onAddLocation(locationName);
    }
  };

  const handleSaveEdit = (locationName) => {
    if (onEditLocation && editingLocation) {
      onEditLocation(editingLocation, locationName);
    }
  };

  const handleDelete = async (location) => {
    const ok = await confirm({
      title: 'Delete location?',
      message: `"${location}" comes off the list. Past sessions keep it.`,
      confirmLabel: 'Delete',
      destructive: true
    });
    if (ok && onRemoveLocation) onRemoveLocation(location);
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-2xl shadow-lg border border-line overflow-hidden">
        <div className="p-6 border-b border-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink">Manage Locations</h2>
              <p className="text-ink-2 mt-1">Add or remove session locations</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-accent text-accent-ink rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              + Add Location
            </button>
          </div>
        </div>

        <div className="p-6">
          {locations.length === 0 ? (
            <p className="text-ink-2 text-center py-8">No locations added yet</p>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location}
                  className="p-4 bg-surface-2 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-ink-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-semibold text-ink">{location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingLocation(location)}
                        className="px-3 py-1.5 bg-surface-2 text-ink rounded-lg font-semibold text-sm hover:bg-line-strong transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location)}
                        className="px-3 py-1.5 bg-danger-soft text-danger rounded-lg font-semibold text-sm hover:brightness-110 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <EditLocationModal
          location={null}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveAdd}
        />
      )}

      {editingLocation && (
        <EditLocationModal
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default ManageLocations;
