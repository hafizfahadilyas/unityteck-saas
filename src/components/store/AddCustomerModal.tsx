import React, { useMemo, useState } from 'react';
import { Check, Users, X } from 'lucide-react';
import type { CustomerSource, CustomerStatus } from '../../types';
import { CUSTOMER_GENDER_OPTIONS, normalizeSaudiCityId } from '../../data/saudiCities';
import { slugCityId, useSaudiCityOptions } from '../../hooks/useSaudiCityOptions';
import { ORDER_SOURCE_OPTIONS, OrderSourceIcon } from '../common/BrandIcons';
import { DateCalendarField } from '../common/DateCalendarField';
import { GlobalModal } from '../common/GlobalModal';
import { MediaUploadField } from '../common/MediaUploadField';
import { PortalSelect } from '../common/PortalSelect';
import { SaudiCitySelect } from '../common/SaudiCitySelect';
import { useToast } from '../common/ToastProvider';
import { getArabCustomerAvatar, getCustomerSeoAlt } from '../../utils/customerAvatars';

export type AddCustomerPayload = {
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: CustomerStatus;
  city: string;
  country: string;
  gender: 'Male' | 'Female' | 'Other';
  dob?: string;
  source: CustomerSource;
  group: string;
  totalOrders: number;
  totalSpending: number;
  avgOrderValue: number;
  lastOrderDate: string;
  avatar: string;
};

type GroupOption = { value: string; label: string };

type AddCustomerModalProps = {
  isAr: boolean;
  storeId: string;
  storeName?: string;
  groupOptions: GroupOption[];
  customGroupsEmpty: boolean;
  onClose: () => void;
  onSave: (payload: AddCustomerPayload) => void;
};

/**
 * Isolated add-customer form so keystrokes do not re-render the customers table.
 */
export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isAr,
  storeId,
  storeName,
  groupOptions,
  customGroupsEmpty,
  onClose,
  onSave,
}) => {
  const { toast } = useToast();
  const {
    cities: saudiCities,
    addCity: addSaudiCity,
    removeCity: removeSaudiCity,
  } = useSaudiCityOptions(storeId);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+966 50 ');
  const [city, setCity] = useState('Riyadh');
  const [source, setSource] = useState<CustomerSource>('Instagram');
  const [status, setStatus] = useState<CustomerStatus>('Active');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('');
  const [group, setGroup] = useState(groupOptions[0]?.value || 'Regular');
  const [avatar, setAvatar] = useState('');

  const acquisitionSourceOptions = useMemo(
    () =>
      ORDER_SOURCE_OPTIONS.map((o) => ({
        value: o.value,
        label: isAr ? o.labelAr : o.labelEn,
        icon: <OrderSourceIcon source={o.value} className="w-3.5 h-3.5" />,
      })),
    [isAr],
  );

  const genderOptions = useMemo(
    () =>
      CUSTOMER_GENDER_OPTIONS.map((g) => ({
        value: g.id,
        label: isAr ? g.nameAr : g.nameEn,
      })),
    [isAr],
  );

  const statusOptions = useMemo(
    () => [
      { value: 'Active', label: isAr ? 'نشط' : 'Active' },
      { value: 'VIP', label: isAr ? 'عميل مميز' : 'VIP' },
      { value: 'New', label: isAr ? 'جديد' : 'New' },
      { value: 'Inactive', label: isAr ? 'غير نشط' : 'Inactive' },
    ],
    [isAr],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    const fullName = `${first} ${last}`.trim();
    if (!fullName) return;

    const emailFallback = `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.sa`;
    const groupValue = group.trim() || (status === 'VIP' ? 'VIP' : 'Regular');

    onSave({
      name: fullName,
      firstName: first,
      lastName: last,
      phone,
      email: emailFallback,
      status,
      city: normalizeSaudiCityId(city, saudiCities) || city,
      country: 'Saudi Arabia',
      gender,
      dob: dob.trim() || undefined,
      source,
      group: groupValue,
      totalOrders: 0,
      totalSpending: 0,
      avgOrderValue: 0,
      lastOrderDate: '—',
      avatar: avatar || getArabCustomerAvatar({ name: fullName, gender }),
    });
  };

  const fieldClass =
    'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--input-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

  return (
    <GlobalModal onClose={onClose} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'إضافة عميل جديد' : 'Add New Customer'}>
      <div
        className="rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <div className="unity-modal-header px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 unity-modal-icon" />
            <h3 className="font-bold text-base">{isAr ? 'إضافة عميل جديد' : 'Add New Customer'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-3.5 text-xs overflow-y-auto"
          style={{ color: 'var(--text)' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="unity-modal-label block font-semibold mb-1">
                {isAr ? 'الاسم الأول *' : 'First Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: فيصل' : 'e.g. Faisal'}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'اسم العائلة *' : 'Last Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: العتيبي' : 'e.g. Al-Otaibi'}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'رقم الجوال' : 'Phone Number'}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${fieldClass} font-mono`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'الجنس' : 'Gender'}
              </label>
              <PortalSelect
                value={gender}
                onChange={(v) => setGender(v as 'Male' | 'Female' | 'Other')}
                options={genderOptions}
                preferBelow
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'تاريخ الميلاد' : 'Date of Birth'}
              </label>
              <DateCalendarField
                value={dob}
                onChange={setDob}
                isAr={isAr}
                className={fieldClass}
              />
            </div>
            <div className="min-w-0 relative z-20">
              <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'المدينة' : 'City'}
              </label>
              <SaudiCitySelect
                value={city}
                onChange={setCity}
                cities={saudiCities}
                isAr={isAr}
                preferBelow
                manageEnabled
                className={fieldClass}
                onAddCity={(nameEn, nameAr) => {
                  const ok = addSaudiCity({ nameEn, nameAr });
                  toast(
                    ok
                      ? isAr
                        ? 'تمت إضافة المدينة'
                        : 'City added'
                      : isAr
                        ? 'المدينة موجودة مسبقاً'
                        : 'City already exists',
                    ok ? 'success' : 'warning',
                  );
                  if (ok) {
                    const nextId = slugCityId(nameEn.trim() || nameAr.trim());
                    if (nextId) setCity(nextId);
                  }
                  return ok;
                }}
                onRemoveCity={(id) => {
                  removeSaudiCity(id);
                  toast(isAr ? 'تم حذف المدينة من القائمة' : 'City removed from list', 'success');
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'مجموعة العميل' : 'Customer Group'}
              </label>
              <PortalSelect
                value={group}
                onChange={setGroup}
                options={groupOptions}
                preferBelow
                className={fieldClass}
              />
              {customGroupsEmpty ? (
                <p className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'أنشئ مجموعة من زر المجموعات لتظهر هنا.'
                    : 'Create a group from Groups to show it here.'}
                </p>
              ) : null}
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'الحالة الأولية' : 'Initial Status'}
              </label>
              <PortalSelect
                value={status}
                onChange={(v) => setStatus(v as CustomerStatus)}
                options={statusOptions}
                preferBelow
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1" style={{ color: 'var(--text)' }}>
              {isAr ? 'مصدر جلب العميل' : 'Acquisition Source'}
            </label>
            <PortalSelect
              value={source}
              onChange={(v) => setSource(v as CustomerSource)}
              options={acquisitionSourceOptions}
              preferBelow
              estimatedHeight={280}
              className={fieldClass}
            />
          </div>

          <MediaUploadField
            label={isAr ? 'صورة الملف الشخصي (اختياري)' : 'Profile Photo (Optional)'}
            value={avatar}
            onChange={setAvatar}
            aspectRatio="square"
            recommendedSize="400×400"
            initialFolder="customers"
            altText={
              `${firstName} ${lastName}`.trim()
                ? getCustomerSeoAlt(
                    { name: `${firstName} ${lastName}`.trim(), city },
                    storeName,
                    isAr,
                  )
                : undefined
            }
            placeholder={isAr ? 'https://... أو ارفع صورة' : 'https://... or upload a photo'}
            showUrlInput
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:opacity-80"
              style={{ color: 'var(--muted)' }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white rounded-lg font-semibold flex items-center gap-1.5 unity-btn-primary"
            >
              <Check className="w-3.5 h-3.5" />
              {isAr ? 'حفظ العميل' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </GlobalModal>
  );
};
