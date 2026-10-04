import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { db } from '../db/database';
import { Sale } from '../types';
import { t } from '../i18n';
import { formatCurrency, formatDate } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Receipt, Package } from 'lucide-react';

export default function ReportsPage() {
  const { currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const lang = settings?.language || 'uz';
  const currency = settings?.currency || "so'm";

  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (!currentUser) return;
    loadData();
  }, [currentUser]);

  async function loadData() {
    if (!currentUser) return;
    const allSales = await db.sales.where('userId').equals(currentUser.id).toArray();
    setSales(allSales);
  }

  const now = new Date();
  let filteredSales = sales;
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredSales = sales.filter(s => new Date(s.createdAt) >= weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredSales = sales.filter(s => new Date(s.createdAt) >= monthAgo);
  }

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.finalTotal, 0);
  const totalDiscount = filteredSales.reduce((sum, s) => sum + s.discount, 0);
  const avgSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  // Daily chart data
  const dailyMap = new Map<string, { date: string; revenue: number; count: number }>();
  filteredSales.forEach(sale => {
    const dateStr = formatDate(sale.createdAt, lang);
    const existing = dailyMap.get(dateStr);
    if (existing) {
      existing.revenue += sale.finalTotal;
      existing.count += 1;
    } else {
      dailyMap.set(dateStr, { date: dateStr, revenue: sale.finalTotal, count: 1 });
    }
  });
  const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Top products
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.qty += item.quantity;
        existing.revenue += item.itemTotal;
      } else {
        productMap.set(item.productId, { name: item.productNameSnapshot, qty: item.quantity, revenue: item.itemTotal });
      }
    });
  });
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports.title', lang)}</h1>
        <div className="flex gap-2">
          {[
            { key: 'week', label: t('history.week', lang) },
            { key: 'month', label: t('history.month', lang) },
            { key: 'all', label: 'Barchasi' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                period === p.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2.5 rounded-lg"><DollarSign size={20} className="text-white" /></div>
            <div>
              <p className="text-xs text-gray-500">{t('reports.revenue', lang)}</p>
              <p className="text-lg font-bold">{formatCurrency(totalRevenue, currency)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2.5 rounded-lg"><Receipt size={20} className="text-white" /></div>
            <div>
              <p className="text-xs text-gray-500">{t('reports.saleCount', lang)}</p>
              <p className="text-lg font-bold">{filteredSales.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-2.5 rounded-lg"><TrendingUp size={20} className="text-white" /></div>
            <div>
              <p className="text-xs text-gray-500">{t('dashboard.averageCheck', lang)}</p>
              <p className="text-lg font-bold">{formatCurrency(avgSale, currency)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2.5 rounded-lg"><Package size={20} className="text-white" /></div>
            <div>
              <p className="text-xs text-gray-500">{t('dashboard.totalDiscount', lang)}</p>
              <p className="text-lg font-bold">{formatCurrency(totalDiscount, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {dailyData.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Kunlik tushum</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Kunlik savdo soni</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-100">
          <p>{t('general.noData', lang)}</p>
        </div>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">{t('reports.topProducts', lang)}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="font-medium text-sm text-gray-900">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatCurrency(product.revenue, currency)}</p>
                  <p className="text-xs text-gray-500">{product.qty} dona</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
