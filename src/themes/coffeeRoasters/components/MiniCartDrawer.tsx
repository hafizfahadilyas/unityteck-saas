import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Coffee } from 'lucide-react';

export const MiniCartDrawer: React.FC = () => {
  const {
    cart,
    isMiniCartOpen,
    setIsMiniCartOpen,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
    navigateTo,
    language
  } = useCart();

  if (!isMiniCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden selection:bg-neutral-900 selection:text-white">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsMiniCartOpen(false)}
      />

      <div className={`fixed inset-y-0 ${language === 'AR' ? 'left-0 pl-0 pr-10' : 'right-0 pl-10 pr-0'} max-w-full flex`}>
        <div className="w-screen max-w-md bg-white flex flex-col text-start text-neutral-900">
          {/* Header */}
          <div className="p-5 flex items-center justify-between bg-neutral-50/80">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-neutral-900" />
              <h2 className="text-base font-bold text-neutral-900">
                {language === 'AR' ? `سلة التسوق (${cartCount})` : `Shopping Bag (${cartCount})`}
              </h2>
            </div>
            <button
              onClick={() => setIsMiniCartOpen(false)}
              className="p-1.5 hover:bg-neutral-200 rounded-full text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Alert */}
          <div className="bg-neutral-100 px-5 py-2.5 text-xs text-neutral-800 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
              ✓
            </span>
            <span className="font-medium">
              {language === 'AR'
                ? 'تهانينا! لقد حصلت على الشحن السريع المجاني لكافة مدن المملكة.'
                : 'You have unlocked Free Express Shipping across KSA!'}
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Coffee className="w-12 h-12 text-neutral-300 mx-auto" />
                <h3 className="font-bold text-neutral-800 text-sm">
                  {language === 'AR' ? 'سلة المشتريات فارغة' : 'Your shopping bag is empty'}
                </h3>
                <button
                  onClick={() => {
                    setIsMiniCartOpen(false);
                    navigateTo('products');
                  }}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-transform active:scale-95 cursor-pointer"
                >
                  {language === 'AR' ? 'تصفح المكائن والمستلزمات' : 'Explore Equipment'}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-neutral-100/70 flex gap-4 items-center"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-16 h-16 object-contain rounded-xl bg-white p-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-neutral-900 truncate">
                        {item.productName}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
                      <span>{language === 'AR' && item.selectedColor.nameAr ? item.selectedColor.nameAr : item.selectedColor.name}</span>
                      <span>·</span>
                      <span>{item.selectedStorage.capacity}</span>
                    </div>

                    {item.selectedWarranty && (
                      <div className="mt-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.selectedWarranty.name}</span>
                      </div>
                    )}

                    {item.customCornerSpecs && (
                      <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 font-mono font-semibold">
                        <span>✦ {item.customCornerSpecs.dimensions.width}×{item.customCornerSpecs.dimensions.depth}×{item.customCornerSpecs.dimensions.height} cm · {language === 'AR' ? item.customCornerSpecs.woodTypeNameAr : item.customCornerSpecs.woodTypeName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2.5 pt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-lg bg-neutral-200/80">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-300 rounded-l-lg cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-neutral-900 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-300 rounded-r-lg cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="font-bold text-xs text-neutral-900 font-mono">
                        {language === 'AR' ? `${(item.unitPrice * item.quantity).toLocaleString()}.00 ر.س` : `SAR ${(item.unitPrice * item.quantity).toLocaleString()}.00`}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Checkout Actions */}
          {cart.length > 0 && (
            <div className="p-5 bg-neutral-100/80 space-y-3">
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>{language === 'AR' ? 'المجموع (شامل 15% ضريبة)' : 'Subtotal (Incl. 15% VAT)'}</span>
                  <span className="font-semibold text-neutral-900 font-mono">
                    {language === 'AR' ? `${cartTotal.toLocaleString()}.00 ر.س` : `SAR ${cartTotal.toLocaleString()}.00`}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>{language === 'AR' ? 'الشحن والتوصيل' : 'Shipping'}</span>
                  <span>{language === 'AR' ? 'مجاني' : 'FREE'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2">
                  <span>{language === 'AR' ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
                  <span className="font-mono text-base text-neutral-900">
                    {language === 'AR' ? `${cartTotal.toLocaleString()}.00 ر.س` : `SAR ${cartTotal.toLocaleString()}.00`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsMiniCartOpen(false);
                    navigateTo('cart');
                  }}
                  className="w-full py-2.5 px-4 bg-neutral-200 text-neutral-800 hover:bg-neutral-300 font-semibold text-xs rounded-full transition-colors text-center cursor-pointer"
                >
                  {language === 'AR' ? 'عرض السلة' : 'View Cart'}
                </button>
                <button
                  onClick={() => {
                    setIsMiniCartOpen(false);
                    navigateTo('checkout');
                  }}
                  className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{language === 'AR' ? 'الدفع الآمن' : 'Check Out'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
