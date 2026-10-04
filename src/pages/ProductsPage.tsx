import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { db } from '../db/database';
import { Product, Category } from '../types';
import { t } from '../i18n';
import { generateId } from '../utils/format';
import { Plus, Edit2, Trash2, X, Package, Search, FolderOpen } from 'lucide-react';

export default function ProductsPage() {
  const { currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const lang = settings?.language || 'uz';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Product form
  const [pName, setPName] = useState('');
  const [pUnit, setPUnit] = useState('dona');
  const [pBarcode, setPBarcode] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pImage, setPImage] = useState('');

  // Category form
  const [cName, setCName] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    loadData();
  }, [currentUser]);

  async function loadData() {
    if (!currentUser) return;
    const prods = await db.products.where('userId').equals(currentUser.id).toArray();
    const cats = await db.categories.where('userId').equals(currentUser.id).toArray();
    setProducts(prods);
    setCategories(cats);
  }

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search))
  );

  function openAddProduct() {
    setEditingProduct(null);
    setPName(''); setPUnit('dona'); setPBarcode(''); setPCategory(''); setPImage('');
    setShowProductModal(true);
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setPName(p.name); setPUnit(p.unit); setPBarcode(p.barcode || ''); setPCategory(p.categoryId || ''); setPImage(p.image || '');
    setShowProductModal(true);
  }

  async function saveProduct() {
    if (!pName.trim() || !currentUser) return;
    const now = new Date();
    if (editingProduct) {
      await db.products.put({
        ...editingProduct,
        name: pName.trim(),
        unit: pUnit,
        barcode: pBarcode || undefined,
        categoryId: pCategory || undefined,
        image: pImage || undefined,
        updatedAt: now,
      });
    } else {
      await db.products.add({
        id: generateId(),
        userId: currentUser.id,
        name: pName.trim(),
        unit: pUnit,
        barcode: pBarcode || undefined,
        categoryId: pCategory || undefined,
        image: pImage || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
    setShowProductModal(false);
    loadData();
  }

  async function deleteProduct(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await db.products.delete(id);
    loadData();
  }

  function openAddCategory() {
    setEditingCategory(null);
    setCName('');
    setShowCategoryModal(true);
  }

  function openEditCategory(c: Category) {
    setEditingCategory(c);
    setCName(c.name);
    setShowCategoryModal(true);
  }

  async function saveCategory() {
    if (!cName.trim() || !currentUser) return;
    const now = new Date();
    if (editingCategory) {
      await db.categories.put({ ...editingCategory, name: cName.trim(), updatedAt: now });
    } else {
      await db.categories.add({ id: generateId(), userId: currentUser.id, name: cName.trim(), createdAt: now, updatedAt: now });
    }
    setShowCategoryModal(false);
    loadData();
  }

  async function deleteCategory(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await db.categories.delete(id);
    // Remove category from products
    const prods = products.filter(p => p.categoryId === id);
    for (const p of prods) {
      await db.products.update(p.id, { categoryId: undefined });
    }
    loadData();
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('products.title', lang)}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'categories' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
          >
            <FolderOpen size={16} className="inline mr-1" />
            {t('categories.title', lang)}
          </button>
          <button
            onClick={openAddProduct}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={16} />
            {t('products.add', lang)}
          </button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Mahsulot nomi yoki shtrix-kod..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package size={48} className="mx-auto mb-3 text-gray-300" />
              <p>{products.length === 0 ? t('products.empty', lang) : "Mahsulot topilmadi"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.unit}{product.barcode ? ` • ${product.barcode}` : ''}</p>
                    {product.categoryId && (
                      <p className="text-xs text-blue-500">{categories.find(c => c.id === product.categoryId)?.name}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditProduct(product)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={openAddCategory}
            className="flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <Plus size={16} />
            {t('categories.add', lang)}
          </button>

          {categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <p>{t('categories.empty', lang)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-500">{products.filter(p => p.categoryId === cat.id).length} mahsulot</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditCategory(cat)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editingProduct ? t('products.edit', lang) : t('products.add', lang)}</h2>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.name', lang)} *</label>
                  <input type="text" value={pName} onChange={e => setPName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.unit', lang)}</label>
                  <select value={pUnit} onChange={e => setPUnit(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="dona">dona</option>
                    <option value="kg">kg</option>
                    <option value="litr">litr</option>
                    <option value="dona (quti)">dona (quti)</option>
                    <option value="metr">metr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.barcode', lang)}</label>
                  <input type="text" value={pBarcode} onChange={e => setPBarcode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.category', lang)}</label>
                  <select value={pCategory} onChange={e => setPCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">—</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.image', lang)}</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
                  {pImage && <img src={pImage} alt="" className="mt-2 w-20 h-20 object-cover rounded-lg" />}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowProductModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('general.cancel', lang)}</button>
                  <button onClick={saveProduct} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('general.save', lang)}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editingCategory ? t('general.edit', lang) : t('categories.add', lang)}</h2>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('categories.name', lang)} *</label>
                  <input type="text" value={cName} onChange={e => setCName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCategoryModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('general.cancel', lang)}</button>
                  <button onClick={saveCategory} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">{t('general.save', lang)}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
