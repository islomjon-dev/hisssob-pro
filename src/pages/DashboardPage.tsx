import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { db } from '../db/database';
import { Sale } from '../types';
import { t } from '../i18n';
import { formatCurrency, formatDateTime } from '../utils/format';
import { ShoppingCart, DollarSign, TrendingUp, Tag, Receipt, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const lang = settings?.language || 'uz';
  const currency = settings?.currency || "so'm";

  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    loadData();
  }, [currentUser]);

  async function loadData() {
    if (!currentUser) return;
    const sales = await db.sales.where('userId').equals(currentUser.id).reverse().sortBy('createdAt');
    setAllSales(sales);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOnly = sales.filter(s => new Date(s.createdAt) >= today);
    setTodaySales(todayOnly);
    setRecentSales(sales.slice(0, 5));
  }

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.finalTotal, 0);
  const totalRevenue = allSales.reduce((sum, s) => sum + s.finalTotal, 0);
  const totalDiscount = allSales.reduce((sum, s) => sum + s.discount, 0);
  const avgCheck = allSales.length > 0 ? totalRevenue / allSales.length : 0;

  const stats = [
    { label: t('dashboard.todaySales', lang), value: todaySales.length.toString(), icon: ShoppingCart, color: 'bg-blue-500' },
    { label: t('dashboard.todayRevenue', lang), value: formatCurrency(todayRevenue, currency), icon: DollarSign, color: 'bg-green-500' },
    { label: t('dashboard.totalSales', lang), value: allSales.length.toString(), icon: Receipt, color: 'bg-purple-500' },
    { label: t('dashboard.totalDiscount', lang), value: formatCurrency(totalDiscount, currency), icon: Tag, color: 'bg-orange-500' },
    { label: t('dashboard.averageCheck', lang), value: formatCurrency(avgCheck, currency), icon: TrendingUp, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.dashboard', lang)}</h1>
        <Link
          to="/sales"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          {t('dashboard.newSale', lang)}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentSales', lang)}</h2>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Receipt size={48} className="mx-auto mb-3 text-gray-300" />
            <p>{t('history.empty', lang)}</p>
            <Link to="/sales" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              {t('dashboard.newSale', lang)} →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentSales.map(sale => (
              <Link key={sale.id} to={`/history/${sale.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{sale.saleNumber}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(sale.createdAt, lang)}</p>
                  <p className="text-xs text-gray-400">{sale.items.length} mahsulot</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(sale.finalTotal, currency)}</p>
                  {sale.discount > 0 && (
                    <p className="text-xs text-orange-500">-{formatCurrency(sale.discount, currency)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
