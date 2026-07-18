'use client';

import { useState, useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';
import { FiSave } from 'react-icons/fi';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { siteSettings, updateSettingInStore } = useUiStore();
  
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');

  useEffect(() => {
    fetchSettingsList();
  }, []);

  const fetchSettingsList = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/settings');
      if (data.success) {
        setSettings(data.raw); // raw settings have type, category, label
      }
    } catch (err) {
      console.error('Fetch settings list error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (key, val) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: String(val) } : s))
    );
  };

  const handleSave = async (key, value) => {
    setIsSaving(true);
    try {
      const { data } = await api.put(`/settings/${key}`, { value });
      if (data.success) {
        updateSettingInStore(key, value); // Sync dynamic settings globally in local zustand store
        toast.success('Setting updated successfully');
        fetchSettingsList();
      }
    } catch (err) {
      toast.error('Failed to save settings modifications');
    } finally {
      setIsSaving(false);
    }
  };

  const categoriesTabs = [
    { id: 'branding', label: 'Identity & Logos' },
    { id: 'hero', label: 'Hero Banner' },
    { id: 'footer', label: 'Footer & Contacts' },
    { id: 'seo', label: 'SEO Settings' },
    { id: 'general', label: 'General Rules' },
  ];

  const filteredSettings = settings.filter((s) => s.category === activeTab);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="border-b border-white/20 pb-3 mb-1">
        <h2 className="text-lg font-bold text-gray-800">Site Customization & Branding</h2>
        <p className="text-xs text-gray-400 mt-0.5">Customize visual layouts, headlines, taglines and rules dynamically</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-white/15 pb-2 font-semibold text-xs md:text-sm select-none">
        {categoriesTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-lavender-500/10 to-blush-400/10 border border-lavender-200/50 text-lavender-600 font-bold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor list */}
      <div className="flex flex-col gap-4 max-w-2xl">
        {filteredSettings.map((setting) => (
          <GlassCard key={setting.key} className="p-5 flex flex-col gap-3 relative" hover={false}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-sm font-bold text-gray-700">{setting.label}</h4>
              <span className="text-[10px] font-semibold text-gray-400 font-mono select-none">
                Key: {setting.key}
              </span>
            </div>

            {/* Input elements based on settings types */}
            {setting.type === 'boolean' ? (
              <label className="flex items-center gap-3 text-sm text-gray-600 font-semibold cursor-pointer py-1 select-none">
                <input
                  type="checkbox"
                  checked={setting.value === 'true'}
                  onChange={(e) => handleValueChange(setting.key, e.target.checked ? 'true' : 'false')}
                  className="rounded border-gray-300 text-lavender-500 focus:ring-lavender-400 w-4 h-4"
                />
                Enabled
              </label>
            ) : setting.type === 'image' ? (
              <div className="flex flex-col gap-2">
                <GlassInput
                  value={setting.value}
                  onChange={(e) => handleValueChange(setting.key, e.target.value)}
                  placeholder="Enter Image URL"
                />
                {setting.value && (
                  <img
                    src={setting.value}
                    alt={setting.label}
                    className="w-full max-h-40 object-cover rounded-xl border border-white/20 mt-1 select-none"
                  />
                )}
              </div>
            ) : (
              <GlassInput
                value={setting.value}
                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                placeholder="Enter value"
              />
            )}

            {/* Save trigger */}
            <div className="flex justify-end mt-2 select-none">
              <GlassButton
                size="sm"
                onClick={() => handleSave(setting.key, setting.value)}
                loading={isSaving}
                className="flex items-center gap-1.5 py-2 px-4"
              >
                <FiSave size={14} /> Save Setting
              </GlassButton>
            </div>
          </GlassCard>
        ))}

        {filteredSettings.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-xs font-semibold">No custom settings in this category.</div>
        )}
      </div>
    </div>
  );
}
