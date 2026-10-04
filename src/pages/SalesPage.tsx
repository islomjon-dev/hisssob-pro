import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useCartStore } from '../store/cartStore';
import { db } from '../db/database';
import { Product, Category, Sale, SaleItem } from '../types';
import { t } from '../i18n';
import { formatCurrency, generateId, generateSaleNumber } from '../utils/format';
import { validateSale, calculateSubtotal } from '../utils/calculations';
import { Search, ShoppingCart, Plus, Minus, Trash2, X, Check, Package } from 'lucide-react';

export default function SalesPage() {
  const { currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const lang = settings?.language || 'uz';
  const currency = settings?.currency || "so'm";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const {
    items, discount, payment, activeItemId,
    addItem, updatePrice, updateQuantity, removeItem,
    setDiscount, setPayment, clearCart,
    getSubtotal, getFinalTotal, getChange,
  } = useCartStore();

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

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchSearch && matchCategory;
  });

  const subtotal = getSubtotal();
  const finalTotal = getFinalTotal();
  const change = getChange();

  const handleProductClick = (product: Product) => {
    addItem(product.id, product.name, product.image);
    setShowCart(true);
    // Focus price input after a short delay
    setTimeout(() => {
      priceInputRef.current?.focus();
    }, 100);
  };

  const handleCompleteSale = async () => {
    if (isSubmitting) return;
    
    const validation = validateSale(items, discount, payment, finalTotal);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Xato");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const saleItems: SaleItem[] = items.map(item => ({
        id: generateId(),
        productId: item.productId,
        productNameSnapshot: item.productName,
        quantity: item.quantity,
        salePrice: item.salePrice!,
        itemTotal: item.itemTotal,
      }));

      const sale: Sale = {
        id: generateId(),
        userId: currentUser!.id,
        saleNumber: generateSaleNumber(),
        items: saleItems,
        subtotal,
        discount,
        finalTotal,
        payment,
        change: Math.max(0, change),
        createdAt: new Date(),
      };

      await db.sales.add(sale);
      clearCart();
      setShowCart(false);
      setSuccessMsg("Savdo muvaffaqiyatli saqlandi! ✓");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setErrorMsg("Savdoni saqlashda xato yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeItem = items.find(i => i.productId === activeItemId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('sales.title', lang)}</h1>

      {successMsg && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <Check size={18} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{errorMsg}</div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('sales.search', lang)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('sales.allCategories', lang)}
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-3 text-gray-300" />
          <p>{products.length === 0 ? t('products.empty', lang) : "Mahsulot topilmadi"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="bg-white rounded-xl border border-gray-200 p-3 hover:border-blue-300 hover:shadow-md transition-all text-center group"
            >
              <div className="w-full aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={32} className="text-gray-300" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">{product.name}</p>
              <p className="text-xs text-gray-400">{product.unit}</p>
            </button>
          ))}
        </div>
      )}

      {/* Cart Section - Desktop: side panel, Mobile: full overlay */}
      {items.length > 0 && (
        <>
          {/* Mobile Cart Toggle */}
          <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3 z-30 shadow-lg">
            <button
              onClick={() => setShowCart(true)}
              className="w-full flex items-center justify-between bg-blue-600 text-white py-3 px-4 rounded-lg"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart size={20} />
                <span>{items.length} mahsulot</span>
              </span>
              <span className="font-bold">{formatCurrency(finalTotal, currency)}</span>
            </button>
          </div>

          {/* Cart Overlay / Panel */}
          <div className={`${showCart ? 'fixed inset-0 z-50' : 'hidden lg:block'}`}>
            {showCart && <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={() => setShowCart(false)} />}
            <div className={`${showCart ? 'absolute' : ''} right-0 top-0 bottom-0 w-full lg:w-96 bg-white lg:fixed lg:top-0 lg:right-0 lg:h-full lg:border-l border-gray-200 overflow-y-auto shadow-xl`}>
              <div className="p-4 space-y-4">
                {/* Cart Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">{t('sales.cart', lang)}</h2>
                  <button onClick={() => setShowCart(false)} className="lg:hidden p-2">
                    <X size={20} />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="space-y-3">
                  {items.map(item => (
                    <div
                      key={item.productId}
                      className={`p-3 rounded-lg border ${
                        activeItemId === item.productId ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => useCartStore.getState().setActiveItem(item.productId)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900">{item.productName}</span>
                        <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {/* Price Input */}
                      <div className="mb-2">
                        <label className="text-xs text-gray-500">{t('sales.price', lang)}</label>
                        <input
                          ref={activeItemId === item.productId ? priceInputRef : undefined}
                          type="number"
                          min="0"
                          value={item.salePrice ?? ''}
                          onChange={e => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                          placeholder={t('sales.enterPrice', lang)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{t('sales.quantity', lang)}:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="w-12 text-center py-1.5 text-sm border-x border-gray-300 outline-none"
                          />
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="ml-auto text-sm font-bold text-gray-900">
                          {formatCurrency(item.itemTotal, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('sales.subtotal', lang)}</span>
                    <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">{t('sales.discount', lang)}</label>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discount || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        if (val > subtotal) {
                          setErrorMsg(t('validation.discountExceed', lang));
                        } else {
                          setErrorMsg('');
                          setDiscount(val);
                        }
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="flex justify-between text-base font-bold">
                    <span>{t('sales.finalTotal', lang)}</span>
                    <span className="text-blue-600">{formatCurrency(finalTotal, currency)}</span>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">{t('sales.payment', lang)}</label>
                    <input
                      type="number"
                      min="0"
                      value={payment || ''}
                      onChange={e => setPayment(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {payment >= finalTotal && finalTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('sales.change', lang)}</span>
                      <span className="font-bold text-green-600">{formatCurrency(change, currency)}</span>
                    </div>
                  )}
                  {payment > 0 && payment < finalTotal && (
                    <p className="text-xs text-red-500">{t('validation.paymentInsufficient', lang)}</p>
                  )}

                  <button
                    onClick={handleCompleteSale}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('general.loading', lang) : t('sales.complete', lang)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
