import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { db } from '../db/database';
import { Sale } from '../types';
import { t } from '../i18n';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Search, Receipt, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HistoryPage() {
  const { currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const lang = settings?.language || 'uz';
  const currency = settings?.currency || "so'm";

  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    if (!currentUser) return;
    loadData();
  }, [currentUser]);

  async function loadData() {
    if (!currentUser) return;
    const allSales = await db.sales.where('userId').equals(currentUser.id).reverse().sortBy('createdAt');
    setSales(allSales);
  }

  const filteredSales = sales.filter(sale => {
    // Search filter
    const matchSearch = !search || 
      sale.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
      sale.items.some(item => item.productNameSnapshot.toLowerCase().includes(search.toLowerCase()));
    
    // Date filter
    let matchDate = true;
    const now = new Date();
    const saleDate = new Date(sale.createdAt);
    
    if (filter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchDate = saleDate >= today;
    } else if (filter === 'yesterday') {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchDate = saleDate >= yesterday && saleDate < today;
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchDate = saleDate >= weekAgo;
    } else if (filter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchDate = saleDate >= monthAgo;
    }

    return matchSearch && matchDate;
  });

  const totalPages = Math.ceil(filteredSales.length / perPage);
  const paginatedSales = filteredSales.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('history.title', lang)}</h1>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Savdo ID yoki mahsulot nomi..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Barchasi' },
            { key: 'today', label: t('history.today', lang) },
            { key: 'yesterday', label: t('history.yesterday', lang) },
            { key: 'week', label: t('history.week', lang) },
            { key: 'month', label: t('history.month', lang) },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key as any); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales List */}
      {paginatedSales.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Receipt size={48} className="mx-auto mb-3 text-gray-300" />
          <p>{t('history.empty', lang)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedSales.map(sale => (
            <Link
              key={sale.id}
              to={`/history/${sale.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{sale.saleNumber}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDateTime(sale.createdAt, lang)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {sale.items.map(i => i.productNameSnapshot).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(sale.finalTotal, currency)}</p>
                  <p className="text-xs text-gray-500">{sale.items.length} mahsulot</p>
                  {sale.discount > 0 && (
                    <p className="text-xs text-orange-500">-{formatCurrency(sale.discount, currency)}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
