import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { db } from '../db/database';
import { t } from '../i18n';
import { Download, Upload, Globe, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const { currentUser } = useAuthStore();
  const { settings, updateSettings } = useSettingsStore();
  const lang = settings?.language || 'uz';

  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handleExport = async () => {
    if (!currentUser) return;
    try {
      const products = await db.products.where('userId').equals(currentUser.id).toArray();
      const categories = await db.categories.where('userId').equals(currentUser.id).toArray();
      const sales = await db.sales.where('userId').equals(currentUser.id).toArray();
      
      const data = { products, categories, sales, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hissob-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportStatus("Eksport muvaffaqiyatli!");
      setTimeout(() => setExportStatus(''), 3000);
    } catch (e) {
      setExportStatus("Eksportda xato yuz berdi");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.products && Array.isArray(data.products)) {
        for (const p of data.products) {
          await db.products.put({ ...p, userId: currentUser.id });
        }
      }
      if (data.categories && Array.isArray(data.categories)) {
        for (const c of data.categories) {
          await db.categories.put({ ...c, userId: currentUser.id });
        }
      }
      if (data.sales && Array.isArray(data.sales)) {
        for (const s of data.sales) {
          await db.sales.put({ ...s, userId: currentUser.id });
        }
      }
      
      setImportStatus("Import muvaffaqiyatli!");
      setTimeout(() => setImportStatus(''), 3000);
    } catch (e) {
      setImportStatus("Importda xato: noto'g'ri fayl formati");
      setTimeout(() => setImportStatus(''), 3000);
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings.title', lang)}</h1>

      {/* Language */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Globe size={20} className="text-blue-500" />
          <h2 className="font-semibold text-gray-900">{t('settings.language', lang)}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'uz', label: "O'zbekcha" },
            { value: 'ru', label: 'Русский' },
            { value: 'en', label: 'English' },
          ].map(l => (
            <button
              key={l.value}
              onClick={() => updateSettings({ language: l.value as any })}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                settings?.language === l.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          {settings?.theme === 'dark' ? <Moon size={20} className="text-purple-500" /> : <Sun size={20} className="text-yellow-500" />}
          <h2 className="font-semibold text-gray-900">{t('settings.theme', lang)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ].map(th => (
            <button
              key={th.value}
              onClick={() => updateSettings({ theme: th.value as any })}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                settings?.theme === th.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">{t('settings.currency', lang)}</h2>
        <select
          value={settings?.currency || "so'm"}
          onChange={e => updateSettings({ currency: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="so'm">so'm (UZS)</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="RUB">RUB</option>
        </select>
      </div>

      {/* Export/Import */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Ma'lumotlarni boshqarish</h2>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
          >
            <Download size={18} />
            {t('settings.export', lang)} (JSON)
          </button>
          {exportStatus && <p className="text-sm text-green-600">{exportStatus}</p>}
          
          <label className="flex items-center gap-2 w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium cursor-pointer">
            <Upload size={18} />
            {t('settings.import', lang)} (JSON)
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {importStatus && <p className={`text-sm ${importStatus.includes('xato') ? 'text-red-600' : 'text-green-600'}`}>{importStatus}</p>}
        </div>
      </div>
    </div>
  );
}
