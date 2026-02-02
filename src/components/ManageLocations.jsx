import { useState } from 'react';
import EditLocationModal from './EditLocationModal';

const ManageLocations = ({ locations, onAddLocation, onRemoveLocation, onEditLocation }) => {
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

  const handleDelete = (location) => {
    if (window.confirm(`Are you sure you want to delete "${location}"?`)) {
      if (onRemoveLocation) {
        onRemoveLocation(location);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Manage Locations</h2>
              <p className="text-slate-600 mt-1">Add or remove session locations</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              + Add Location
            </button>
          </div>
        </div>

        <div className="p-6">
          {locations.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No locations added yet</p>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location}
                  className="p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-semibold text-slate-900">{location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingLocation(location)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors"
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
