import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { t } from '../i18n';
import { User, Mail, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuthStore();
  const { settings } = useSettingsStore();
  const lang = settings?.language || 'uz';

  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const success = await updateProfile({ firstName, lastName, email });
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const image = ev.target?.result as string;
      await updateProfile({ profileImage: image });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile', lang)}</h1>

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{t('general.success', lang)}</div>
      )}

      {/* Profile Image */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mx-auto">
            {currentUser?.profileImage ? (
              <img src={currentUser.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-blue-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
            <Camera size={16} />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
        <p className="mt-3 font-medium text-gray-900">{currentUser?.firstName} {currentUser?.lastName}</p>
        <p className="text-sm text-gray-500">{currentUser?.email}</p>
      </div>

      {/* Edit Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.firstName', lang)}</label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.lastName', lang)}</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email', lang)}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {t('general.save', lang)}
        </button>
      </div>
    </div>
  );
}
