import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, Lock, Palette, Loader2, Stethoscope, EyeOff, MapPin } from 'lucide-react';
import { ProfileSection } from './ProfileSection';
import { BusinessSection } from './BusinessSection';
import { SecuritySection } from './SecuritySection';
import { ThemeSection } from './ThemeSection';
import { PracticeProfileSection } from './PracticeProfileSection';
import { PresentationSection } from './PresentationSection';
import { LocationsSection } from './LocationsSection';
import { getCurrentAccount } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

type TabId = 'profile' | 'business' | 'practice' | 'locations' | 'security' | 'theme' | 'presentation';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'practice', label: 'Practice Profile', icon: Stethoscope },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'presentation', label: 'Presentation', icon: EyeOff },
];

export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getCurrentAccount();
      setProfile({
        id: data.id,
        email: user?.email || '',
        name: data.name || '',
        businessName: data.business_name || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zip_code || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load account information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdate = () => {
    fetchProfile();
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-1" aria-label="Account settings tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading account settings...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && profile && (
                <ProfileSection
                  profile={{
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                  }}
                  onUpdate={handleUpdate}
                />
              )}

              {activeTab === 'business' && profile && (
                <BusinessSection
                  profile={{
                    businessName: profile.businessName,
                    address: profile.address,
                    city: profile.city,
                    state: profile.state,
                    zipCode: profile.zipCode,
                  }}
                  onUpdate={handleUpdate}
                />
              )}

              {activeTab === 'practice' && <PracticeProfileSection />}

              {activeTab === 'locations' && <LocationsSection />}

              {activeTab === 'security' && <SecuritySection />}

              {activeTab === 'theme' && <ThemeSection />}

              {activeTab === 'presentation' && <PresentationSection />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
