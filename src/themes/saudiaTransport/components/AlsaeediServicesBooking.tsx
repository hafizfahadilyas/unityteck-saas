import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  MessageCircle,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { BLECO_SERVICES, CAR_BRANDS, CAR_MODELS_MAP, BLECO_STORE_INFO } from '../../../data/blecoStoreData';
import { apiFetch, isApiEnabled } from '../../../api/client';
import { AlsaeediServicesSkeleton } from './AlsaeediSkeletons';

type Props = {
  isAr: boolean;
  storeId: string;
};

type ServiceItem = {
  key: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  durationMin: number;
  fromPrice: number;
  image?: string;
};

const SERVICE_IMAGE_FALLBACK: Record<string, string> = {
  interior_upholstery: '/images/categories/vip-luxury-seat-covers.jpg',
  dashboard_renovation: '/images/categories/car-accessories.jpg',
  window_tinting: '/images/categories/car-care-bleco.jpg',
  ppf: '/images/categories/car-care-bleco.jpg',
  polishing_detailing: '/images/categories/upholstery-tools.jpg',
  steering_gear_upholstery: '/images/categories/vip-luxury-seat-covers.jpg',
};

type SlotResponse = {
  available?: string[];
  booked?: string[];
};

type ApiServiceRow = {
  key: string;
  name_en?: string;
  name_ar?: string;
  nameEn?: string;
  nameAr?: string;
  desc_en?: string;
  desc_ar?: string;
  descEn?: string;
  descAr?: string;
  duration_min?: number;
  durationMin?: number;
  from_price?: number;
  fromPrice?: number;
  image?: string;
  image_url?: string;
  imageUrl?: string;
};

type ServicesResponse = {
  data?: ApiServiceRow[];
  slot_times?: string[];
};

function mapApiService(row: ApiServiceRow): ServiceItem {
  const raw = String(row.image_url || row.imageUrl || row.image || '').trim();
  const fallback = SERVICE_IMAGE_FALLBACK[row.key] || '';
  // Replace legacy mismatched assets (seat/mat cutouts on wrong services)
  const mismatched =
    (row.key === 'dashboard_renovation' && /seat-covers|camry/i.test(raw)) ||
    (row.key === 'window_tinting' && /(mats|floor-mats|laser-mats)/i.test(raw)) ||
    (row.key === 'polishing_detailing' && /floor-mats|diamond-floors/i.test(raw)) ||
    (row.key === 'steering_gear_upholstery' && /seat-covers\/camry/i.test(raw));
  const img = mismatched ? fallback : raw || fallback;
  return {
    key: row.key,
    nameEn: row.name_en || row.nameEn || row.key,
    nameAr: row.name_ar || row.nameAr || row.key,
    descEn: row.desc_en || row.descEn || '',
    descAr: row.desc_ar || row.descAr || '',
    durationMin: Number(row.duration_min ?? row.durationMin ?? 60),
    fromPrice: Number(row.from_price ?? row.fromPrice ?? 0),
    image: img || undefined,
  };
}

const DEFAULT_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00',
];

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '').trim();
}

function isLikelySaudiPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9) return false;
  if (digits.startsWith('966') && digits.length >= 12) return true;
  if (digits.startsWith('05') && digits.length === 10) return true;
  if (digits.startsWith('5') && digits.length === 9) return true;
  return digits.length >= 9;
}

export const AlsaeediServicesBooking: React.FC<Props> = ({ isAr, storeId }) => {
  const [services, setServices] = useState<ServiceItem[]>(() =>
    BLECO_SERVICES.map((s) => ({
      ...s,
      image: s.image || SERVICE_IMAGE_FALLBACK[s.key],
    })),
  );
  const [servicesLoading, setServicesLoading] = useState(!!isApiEnabled());
  const [serviceKey, setServiceKey] = useState(BLECO_SERVICES[0]?.key || '');
  const [extras, setExtras] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [make, setMake] = useState(CAR_BRANDS[0]?.id || 'toyota');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  const models = useMemo(() => CAR_MODELS_MAP[make] || [], [make]);
  const years = useMemo(() => {
    const row = models.find((m) => m.modelEn === model || m.modelAr === model);
    return row?.years || [];
  }, [models, model]);

  const activeService = useMemo(
    () => services.find((s) => s.key === serviceKey) || services[0],
    [services, serviceKey],
  );

  useEffect(() => {
    if (!isApiEnabled() || !storeId) {
      setServicesLoading(false);
      return;
    }
    let cancelled = false;
    setServicesLoading(true);
    const failSafe = window.setTimeout(() => {
      if (!cancelled) setServicesLoading(false);
    }, 8000);
    (async () => {
      try {
        const res = await apiFetch<ServicesResponse>('/storefront/appointments/services', {
          storeId,
          skipAuth: true,
        });
        if (cancelled) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(mapApiService);
          setServices(mapped);
          setServiceKey((prev) => (mapped.some((s) => s.key === prev) ? prev : mapped[0].key));
        }
        if (Array.isArray(res.slot_times) && res.slot_times.length > 0) {
          setSlots(res.slot_times);
        }
      } catch {
        /* keep BLECO_SERVICES fallback */
      } finally {
        window.clearTimeout(failSafe);
        if (!cancelled) setServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
    };
  }, [storeId]);

  useEffect(() => {
    if (!date) return;
    if (!isApiEnabled()) {
      setSlots(DEFAULT_SLOTS);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<SlotResponse>(
          `/storefront/appointments/slots?date=${encodeURIComponent(date)}`,
          { storeId, skipAuth: true },
        );
        if (!cancelled) {
          setSlots(Array.isArray(res.available) && res.available.length ? res.available : DEFAULT_SLOTS);
          setTime('');
        }
      } catch {
        if (!cancelled) setSlots(DEFAULT_SLOTS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, storeId]);

  const toggleExtra = (key: string) => {
    if (key === serviceKey) return;
    setExtras((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDoneId(null);
    const cleanPhone = normalizePhone(phone);
    if (!name.trim() || !cleanPhone || !serviceKey || !date || !time) {
      setError(isAr ? 'أكمل الحقول المطلوبة.' : 'Please complete required fields.');
      return;
    }
    if (!model.trim()) {
      setError(isAr ? 'اختر موديل السيارة.' : 'Select the vehicle model.');
      return;
    }
    if (!isLikelySaudiPhone(cleanPhone)) {
      setError(isAr ? 'أدخل رقم جوال سعودي صحيح.' : 'Enter a valid Saudi mobile number.');
      return;
    }
    setBusy(true);
    try {
      if (!isApiEnabled()) {
        const msg = isAr
          ? `حجز خدمة: ${activeService?.nameAr} | ${date} ${time} | ${make} ${model} ${year} | ${name} | ${cleanPhone}`
          : `Service booking: ${activeService?.nameEn} | ${date} ${time} | ${make} ${model} ${year} | ${name} | ${cleanPhone}`;
        const link = `https://wa.me/${BLECO_STORE_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        setWaLink(link);
        setDoneId('local-wa');
        window.open(link, '_blank');
        return;
      }
      const res = await apiFetch<{ data?: { id?: string }; whatsapp?: string }>(
        '/storefront/appointments',
        {
          method: 'POST',
          storeId,
          skipAuth: true,
          body: {
            customer_name: name.trim(),
            customer_phone: cleanPhone,
            customer_email: email.trim() || null,
            service_key: serviceKey,
            additional_services: extras,
            vehicle_make: make,
            vehicle_model: model || null,
            vehicle_year: year || null,
            appointment_date: date,
            appointment_time: time,
            notes: notes.trim() || null,
          },
        },
      );
      setDoneId(res.data?.id || 'ok');
      if (res.whatsapp) setWaLink(res.whatsapp);
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : isAr ? 'تعذر إرسال الحجز.' : 'Booking failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="services-booking" className="alsaeedi-section alsaeedi-reveal space-y-6 p-4 sm:p-6 lg:p-7">
      <div className="text-center space-y-2 max-w-2xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faede4] text-[#915f3c] text-[11px] font-black shadow-2xs">
          <Wrench className="w-3.5 h-3.5" />
          <span>{isAr ? 'خدمات الورشة' : 'Workshop Services'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {isAr ? 'احجز موعدك' : 'Book an Appointment'}
        </h2>
        <p className="text-sm text-slate-600">
          {isAr
            ? 'اختر الخدمة والوقت — نؤكد عبر واتساب.'
            : 'Pick a service and time — we confirm on WhatsApp.'}
        </p>
      </div>

      {servicesLoading ? (
        <div className="relative z-10">
          <AlsaeediServicesSkeleton />
        </div>
      ) : (
      <>
      <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((svc) => {
          const active = serviceKey === svc.key;
          const img = svc.image || SERVICE_IMAGE_FALLBACK[svc.key] || '';
          return (
            <button
              key={svc.key}
              type="button"
              onClick={() => {
                setServiceKey(svc.key);
                setExtras((prev) => prev.filter((k) => k !== svc.key));
              }}
              className={`cursor-pointer overflow-hidden rounded-2xl text-start transition-all ${
                active
                  ? 'alsaeedi-card-gold shadow-md ring-2 ring-[#915f3c]/25'
                  : 'alsaeedi-card'
              }`}
            >
              {img ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={img}
                    alt={isAr ? svc.nameAr : svc.nameEn}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const el = e.currentTarget;
                      const fallback =
                        SERVICE_IMAGE_FALLBACK[svc.key] ||
                        '/images/categories/vip-luxury-seat-covers.jpg';
                      if (el.dataset.fallbackApplied === '1') {
                        el.style.display = 'none';
                        return;
                      }
                      el.dataset.fallbackApplied = '1';
                      if (fallback && fallback !== el.getAttribute('src')) {
                        el.src = fallback;
                      } else {
                        el.style.display = 'none';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                  {active ? (
                    <span className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-[#f6c344] px-2 py-0.5 text-[10px] font-black text-slate-950">
                      <CheckCircle2 className="h-3 w-3" />
                      {isAr ? 'محدد' : 'Selected'}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="p-3.5 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black leading-snug text-slate-900">
                    {isAr ? svc.nameAr : svc.nameEn}
                  </h3>
                  {active && !img ? <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600" /> : null}
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                  {isAr ? svc.descAr : svc.descEn}
                </p>
                <div className="mt-2.5 flex items-center gap-3 text-[11px] font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-600" />
                    {svc.durationMin} {isAr ? 'د' : 'min'}
                  </span>
                  <span className="text-amber-700">
                    {isAr ? 'من' : 'from'} {svc.fromPrice} ⃁
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={submit}
        className="relative z-10 rounded-2xl sm:rounded-3xl alsaeedi-card-panel p-3.5 sm:p-5 space-y-3.5"
      >
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <CalendarDays className="w-4 h-4 text-amber-600" />
          <span>{isAr ? 'تفاصيل الحجز' : 'Booking details'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-[11px] font-bold text-slate-700 space-y-1">
            <span>{isAr ? 'الاسم *' : 'Name *'}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full h-11 rounded-xl px-3 text-sm font-semibold text-slate-900 bg-[#faf7f4] focus:outline-none focus:ring-2 focus:ring-[#915f3c]/40 shadow-2xs"
              required
            />
          </label>
          <label className="text-[11px] font-bold text-slate-700 space-y-1">
            <span>{isAr ? 'الجوال *' : 'Mobile *'}</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              inputMode="tel"
              placeholder="05xxxxxxxx"
              autoComplete="tel"
              className="w-full h-11 rounded-xl px-3 text-sm font-semibold text-slate-900 bg-[#faf7f4] focus:outline-none focus:ring-2 focus:ring-[#915f3c]/40 shadow-2xs"
              required
            />
          </label>
          <label className="text-[11px] font-bold text-slate-700 space-y-1 sm:col-span-2">
            <span>{isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              autoComplete="email"
              className="w-full h-11 rounded-xl px-3 text-sm font-semibold text-slate-900 bg-[#faf7f4] focus:outline-none focus:ring-2 focus:ring-[#915f3c]/40 shadow-2xs"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-[11px] font-bold text-slate-700 space-y-1">
            <span className="inline-flex items-center gap-1">
              <Car className="w-3 h-3 text-amber-600" />
              {isAr ? 'الماركة' : 'Make'}
            </span>
            <select
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel('');
                setYear('');
              }}
              className="w-full h-11 rounded-xl px-3 text-sm font-semibold bg-[#faf7f4] shadow-2xs"
            >
              {CAR_BRANDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {isAr ? b.nameAr : b.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-700 space-y-1">
            <span>{isAr ? 'الموديل *' : 'Model *'}</span>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setYear('');
              }}
              className="w-full h-11 rounded-xl px-3 text-sm font-semibold bg-[#faf7f4] shadow-2xs"
              required
            >
              <option value="">{isAr ? 'اختر الموديل' : 'Select model'}</option>
              {models.map((m) => (
                <option key={m.modelEn} value={m.modelEn}>
                  {isAr ? m.modelAr : m.modelEn}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-700 space-y-1">
            <span>{isAr ? 'السنة' : 'Year'}</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold bg-slate-50"
            >
              <option value="">{isAr ? 'السنة' : 'Year'}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-700 mb-2">
            {isAr ? 'خدمات إضافية (اختياري)' : 'Add-on services (optional)'}
          </p>
          <div className="flex flex-wrap gap-2">
            {services.filter((s) => s.key !== serviceKey).map((s) => {
              const on = extras.includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleExtra(s.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${
                    on
                      ? 'bg-amber-50 border-[#d5a027] text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {isAr ? s.nameAr : s.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-[11px] font-bold text-slate-700 space-y-1">
            <span>{isAr ? 'تاريخ الموعد *' : 'Date *'}</span>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold bg-slate-50"
              required
            />
          </label>
          <label className="text-[11px] font-bold text-slate-700 space-y-1">
            <span>{isAr ? 'الوقت المتاح *' : 'Available time *'}</span>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold bg-slate-50"
              required
            >
              <option value="">{isAr ? 'اختر الوقت' : 'Select time'}</option>
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-[11px] font-bold text-slate-700 space-y-1 block">
          <span>{isAr ? 'ملاحظات' : 'Notes'}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold bg-slate-50 resize-y min-h-[72px]"
          />
        </label>

        {error && (
          <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        {doneId && (
          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex flex-col gap-1">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              {isAr
                ? 'تم استلام طلب الحجز. سنتواصل لتأكيد الموعد.'
                : 'Booking received. We will confirm your appointment.'}
            </span>
            {doneId !== 'ok' && doneId !== 'local-wa' ? (
              <span className="font-mono text-[10px] text-emerald-800/80" dir="ltr">
                {isAr ? `رقم الحجز: ${doneId}` : `Booking ID: ${doneId}`}
              </span>
            ) : null}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="flex-1 h-12 rounded-xl btn-bashayer-gold font-black text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <CalendarDays className="w-4 h-4" />
            {busy
              ? isAr
                ? 'جاري الإرسال…'
                : 'Submitting…'
              : isAr
                ? 'تأكيد الحجز'
                : 'Confirm booking'}
          </button>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="h-12 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {isAr ? 'واتساب' : 'WhatsApp'}
            </a>
          )}
        </div>
      </form>
      </>
      )}
    </section>
  );
};

export default AlsaeediServicesBooking;
