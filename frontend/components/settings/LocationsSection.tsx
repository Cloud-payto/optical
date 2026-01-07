/**
 * Locations Section Component
 * Manages practice locations in account settings
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useSetPrimaryLocation
} from '../../hooks/useLocations';
import type { PracticeLocation, LocationFormData } from '../../types/location.types';
import {
  Plus,
  MapPin,
  Star,
  Pencil,
  Trash2,
  MoreVertical,
  X,
  Check,
  Loader2,
  Phone
} from 'lucide-react';

interface LocationFormProps {
  initialData?: PracticeLocation;
  onSubmit: (data: LocationFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}

function LocationForm({ initialData, onSubmit, onCancel, isLoading, submitLabel }: LocationFormProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip_code: initialData?.zip_code || '',
    phone: initialData?.phone || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="e.g., Main Office, Downtown Clinic"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Address
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="123 Main Street"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            City
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            State
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
            maxLength={2}
            className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors uppercase"
            placeholder="CA"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ZIP Code
          </label>
          <input
            type="text"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="12345"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={isLoading || !formData.name.trim()}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

interface LocationCardProps {
  location: PracticeLocation;
  onEdit: (location: PracticeLocation) => void;
  onDelete: (location: PracticeLocation) => void;
  onSetPrimary: (location: PracticeLocation) => void;
  isOnlyLocation: boolean;
}

function LocationCard({ location, onEdit, onDelete, onSetPrimary, isOnlyLocation }: LocationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const addressParts = [
    location.address,
    location.city,
    location.state,
    location.zip_code
  ].filter(Boolean);

  return (
    <div className={`relative bg-white dark:bg-[#1F2623] rounded-xl border ${location.is_primary ? 'border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'} p-4 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white">{location.name}</h4>
              {location.is_primary && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  <Star className="h-3 w-3 mr-1" />
                  Primary
                </span>
              )}
            </div>
            {addressParts.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {addressParts.join(', ')}
              </p>
            )}
            {location.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                {location.phone}
              </p>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                >
                  <button
                    onClick={() => {
                      onEdit(location);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  {!location.is_primary && (
                    <button
                      onClick={() => {
                        onSetPrimary(location);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Star className="h-4 w-4" />
                      Set as Primary
                    </button>
                  )}
                  {!isOnlyLocation && (
                    <button
                      onClick={() => {
                        onDelete(location);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function LocationsSection() {
  const { user } = useAuth();
  const accountId = user?.id;

  const { data: locationsData, isLoading } = useLocations(accountId);
  const createLocation = useCreateLocation(accountId);
  const updateLocation = useUpdateLocation(accountId);
  const deleteLocation = useDeleteLocation(accountId);
  const setPrimaryLocation = useSetPrimaryLocation(accountId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PracticeLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<PracticeLocation | null>(null);

  const locations = locationsData?.locations || [];
  const isOnlyLocation = locations.length <= 1;

  const handleCreate = async (data: LocationFormData) => {
    await createLocation.mutateAsync(data);
    setIsAddDialogOpen(false);
  };

  const handleUpdate = async (data: LocationFormData) => {
    if (!editingLocation) return;
    await updateLocation.mutateAsync({ locationId: editingLocation.id, data });
    setEditingLocation(null);
  };

  const handleDelete = async () => {
    if (!deletingLocation) return;
    await deleteLocation.mutateAsync({ locationId: deletingLocation.id });
    setDeletingLocation(null);
  };

  const handleSetPrimary = async (location: PracticeLocation) => {
    await setPrimaryLocation.mutateAsync(location.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Store Locations
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your practice locations for inventory tracking
          </p>
        </div>

        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Add Location</span>
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="bg-white dark:bg-[#1F2623] rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">No locations yet</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add your first location to start tracking inventory by store
          </p>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-md hover:shadow-lg mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Location</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={setEditingLocation}
              onDelete={setDeletingLocation}
              onSetPrimary={handleSetPrimary}
              isOnlyLocation={isOnlyLocation}
            />
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      <AnimatePresence>
        {isAddDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
              onClick={() => setIsAddDialogOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-white dark:bg-[#1F2623] rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Add New Location
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Add a new store or office location to your practice
                  </p>
                  <LocationForm
                    onSubmit={handleCreate}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isLoading={createLocation.isPending}
                    submitLabel="Add Location"
                  />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Location Modal */}
      <AnimatePresence>
        {editingLocation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
              onClick={() => setEditingLocation(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-white dark:bg-[#1F2623] rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Edit Location
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Update the details for this location
                  </p>
                  <LocationForm
                    initialData={editingLocation}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditingLocation(null)}
                    isLoading={updateLocation.isPending}
                    submitLabel="Save Changes"
                  />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingLocation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
              onClick={() => setDeletingLocation(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-white dark:bg-[#1F2623] rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start p-6 pb-4">
                  <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-full p-3">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Location
                    </h3>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300 ml-16">
                    Are you sure you want to delete "{deletingLocation.name}"? This location will be
                    deactivated but existing inventory records will be preserved.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    onClick={() => setDeletingLocation(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLocation.isPending}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleteLocation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Delete Location</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
