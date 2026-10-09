import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Check,
  Tag,
  DollarSign,
  Boxes
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import type { Product } from '../../types';

interface BulkProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (products: Omit<Product, 'id' | 'storeId' | 'publishedAt' | 'isStale'>[]) => void;
  currentProducts: Product[];
  storeName: string;
}

interface ParsedProductRow {
  name: string;
  nameAr?: string;
  category: string;
  sku: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  offersAllowed: boolean;
  productType: string;
  description: string;
  image: string;
}

const SAMPLE_50_FLOWER_ITEMS: ParsedProductRow[] = [
  {
    name: 'Royal Velvet Dutch Roses Bouquet (50 Stems)',
    nameAr: 'باقة ورود هولندية ملكية حمراء (50 وردة)',
    category: 'Luxury Hand Bouquets',
    sku: 'FLW-001',
    price: 349,
    discountedPrice: 289,
    stock: 25,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Fresh premium velvety red Ecuadorian & Dutch roses arranged in silk wrapping with satin ribbons.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Imperial White Lilies & Pastel Hydrangeas',
    nameAr: 'زهور الليلي البيضاء مع هيدرانجيا باستيل',
    category: 'Luxury Hand Bouquets',
    sku: 'FLW-002',
    price: 280,
    discountedPrice: 240,
    stock: 18,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Crisp fragrant oriental lilies blended with Dutch pastel hydrangea and fresh eucalyptus leaves.',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Midnight Black Cylindrical Rose Box (24 Roses)',
    nameAr: 'صندوق ورود منتصف الليل الأسود الفاخر',
    category: 'Rose Boxes',
    sku: 'FLW-003',
    price: 310,
    discountedPrice: 260,
    stock: 30,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Matte black suede luxury cylindrical gift box with fresh scarlet red preserved water-well roses.',
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Blush Pink Round Hatbox Arrangement',
    nameAr: 'صندوق قبعة الزهور باللون الوردي الهادئ',
    category: 'Rose Boxes',
    sku: 'FLW-004',
    price: 275,
    discountedPrice: 225,
    stock: 20,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Soft baby pink avalanche roses, spray carnations, and white gypsophila nestled in a luxury hatbox.',
    image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Enchanted Forever Rose in Glass Cloche Dome (Gold Stem)',
    nameAr: 'وردة بيوتي الدائمة المحفوظة داخل قبة زجاجية',
    category: 'Preserved Forever Roses',
    sku: 'FLW-005',
    price: 395,
    discountedPrice: 350,
    stock: 15,
    offersAllowed: false,
    productType: 'Physical',
    description: '100% natural preserved rose from Ecuador lasting up to 3 years with warm LED ambient lighting base.',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Sapphire Blue Preserved Rose in Crystal Case',
    nameAr: 'وردة زرقاء ياقوتية دائمة في صندوق كريستالي',
    category: 'Preserved Forever Roses',
    sku: 'FLW-006',
    price: 320,
    discountedPrice: 280,
    stock: 12,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Exotic deep sapphire blue preserved rose with delicate petals and personalized gift plaque.',
    image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Crystal Glass Vase with Golden Calla Lilies',
    nameAr: 'فازة كريستال فاخرة مع زنابق الكالا الذهبية',
    category: 'Luxury Vases',
    sku: 'FLW-007',
    price: 450,
    discountedPrice: 390,
    stock: 8,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Heavy faceted Bohemian crystal vase adorned with elegant yellow and cream calla lilies.',
    image: 'https://images.unsplash.com/photo-1589244159943-460088ed5c92?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Marble Ceramic Pot with Pastel Peonies & Ranunculus',
    nameAr: 'إناء سيراميك رخامي مع بيوني ورانونكولوس',
    category: 'Luxury Vases',
    sku: 'FLW-008',
    price: 380,
    discountedPrice: 320,
    stock: 14,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Italian marble finish ceramic pot filled with fluffy Dutch peonies and fragrant sweet peas.',
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Patchi Chocolates & Red Roses Harmony Box',
    nameAr: 'بوكس شوكولاتة باتشي مع ورود حمراء مخملية',
    category: 'Chocolates & Combos',
    sku: 'FLW-009',
    price: 420,
    discountedPrice: 360,
    stock: 22,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Dual layer drawer box featuring 20 fresh roses on top and 500g of artisan luxury pralines below.',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Swiss Godiva Truffles & Sunflower Summer Wrap',
    nameAr: 'باقة عباد الشمس مع شوكولاتة جوديفا السويسرية',
    category: 'Chocolates & Combos',
    sku: 'FLW-010',
    price: 299,
    discountedPrice: 249,
    stock: 16,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Sunny French sunflowers wrapped in kraft paper paired with Godiva gold ballotin chocolate box.',
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Champagne Gardenia & Spray Roses Mini Posy',
    nameAr: 'باقة صغيرة من ورد الشامبانيا والورود الرذاذية',
    category: 'Luxury Hand Bouquets',
    sku: 'FLW-011',
    price: 180,
    discountedPrice: 150,
    stock: 40,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Delicate champagne tones with creamy spray roses and silver dollar eucalyptus.',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Pure White Wedding Orchid Bridal Cascade',
    nameAr: 'باقة عروس فاخرة من بساتين الأوركيد البيضاء',
    category: 'Luxury Hand Bouquets',
    sku: 'FLW-012',
    price: 650,
    discountedPrice: 590,
    stock: 10,
    offersAllowed: false,
    productType: 'Physical',
    description: 'Cascading phalaenopsis orchids with white anemones and french satin handle.',
    image: 'https://images.unsplash.com/photo-1534885320675-b08ab1314263?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Emerald Green Acrylic Box with White Avalanche Roses',
    nameAr: 'صندوق أكريليك زمردي فاخر مع ورود أفالانش',
    category: 'Rose Boxes',
    sku: 'FLW-013',
    price: 340,
    discountedPrice: 295,
    stock: 18,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Translucent emerald acrylic keepsake box with 16 pristine white roses and water reservoir.',
    image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Heart-Shaped Suede Box with 36 Ombre Pink Roses',
    nameAr: 'صندوق مخملي على شكل قلب مع 36 وردة متدرجة',
    category: 'Rose Boxes',
    sku: 'FLW-014',
    price: 380,
    discountedPrice: 330,
    stock: 25,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Handcrafted velvet heart box with smooth ombre transition from deep magenta to pastel blush.',
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Eternal Rainbow Rose in Miniature Bell Jar',
    nameAr: 'وردة قوس قزح الدائمة في قبة زجاجية مصغرة',
    category: 'Preserved Forever Roses',
    sku: 'FLW-015',
    price: 260,
    discountedPrice: 220,
    stock: 30,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Vibrant multicolour rainbow preserved rose that never withers or loses its brightness.',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Vintage Victorian Urn with Deep Burgundy Dahlias',
    nameAr: 'فازة فيكتورية عتيقة مع داليا بلون العنابي الداكن',
    category: 'Luxury Vases',
    sku: 'FLW-016',
    price: 520,
    discountedPrice: 460,
    stock: 6,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Antique finish ceramic urn containing lush autumnal dahlias, berries, and dark foliage.',
    image: 'https://images.unsplash.com/photo-1589244159943-460088ed5c92?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Belgian Macaron Tower & Floral Ring Display',
    nameAr: 'برج ماكرون بلجيكي مع إكليل زهور طبيعية',
    category: 'Chocolates & Combos',
    sku: 'FLW-017',
    price: 490,
    discountedPrice: 420,
    stock: 12,
    offersAllowed: true,
    productType: 'Physical',
    description: '24 Parisian almond macarons ringed with fresh blush spray roses and baby breath.',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Spring Awakening Dutch Tulips in Ombre Wrap',
    nameAr: 'باقة توليب هولندية بألوان الربيع المبهجة',
    category: 'Luxury Hand Bouquets',
    sku: 'FLW-018',
    price: 240,
    discountedPrice: 199,
    stock: 35,
    offersAllowed: true,
    productType: 'Physical',
    description: '30 stems of fresh Holland crisp tulips in mixed sunny yellows, vibrant oranges, and soft pinks.',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Golden Radiance 100 Stems Yellow Rose Spectacular',
    nameAr: 'باقة الإشراق الذهبي 100 وردة صفراء فاخرة',
    category: 'Luxury Hand Bouquets',
    sku: 'FLW-019',
    price: 750,
    discountedPrice: 650,
    stock: 8,
    offersAllowed: false,
    productType: 'Physical',
    description: 'Showstopping hand bouquet composed of 100 long-stem sunshine yellow roses in gold tissue.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Frosted Glass Terrarium with Succulents & Mini Roses',
    nameAr: 'تيراريوم زجاجي مثلج بنباتات عصارية وورود صغيرة',
    category: 'Luxury Vases',
    sku: 'FLW-020',
    price: 290,
    discountedPrice: 245,
    stock: 15,
    offersAllowed: true,
    productType: 'Physical',
    description: 'Geometric brass and glass terrarium featuring low-maintenance echeveria and peach miniature roses.',
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=600&q=80'
  }
];

// Generate 30 more items to make full 50 items
for (let i = 21; i <= 50; i++) {
  const cats = ['Luxury Hand Bouquets', 'Rose Boxes', 'Preserved Forever Roses', 'Luxury Vases', 'Chocolates & Combos'];
  const cat = cats[i % cats.length];
  const price = 120 + (i * 7);
  const disc = price - 30;
  SAMPLE_50_FLOWER_ITEMS.push({
    name: `Premium Florist Edition Bouquet #${i} (${cat})`,
    nameAr: `باقة الزهور الفاخرة رقم ${i} (${cat})`,
    category: cat,
    sku: `FLW-${String(i).padStart(3, '0')}`,
    price: price,
    discountedPrice: disc,
    stock: 10 + (i % 25),
    offersAllowed: i % 3 !== 0,
    productType: 'Physical',
    description: `Carefully curated florist selection featuring seasonal hand-picked blooms, aromatic greenery, and signature gift card.`,
    image: SAMPLE_50_FLOWER_ITEMS[i % 10].image
  });
}

export const BulkProductUploadModal: React.FC<BulkProductUploadModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
  currentProducts,
  storeName
}) => {
  const { t, locale, dir, money } = usePrefs();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  // 1. Download Demo Template CSV (Excel & Google Sheets compatible)
  const handleDownloadDemoTemplate = () => {
    const headers = [
      'Name',
      'Category',
      'SKU',
      'Price',
      'DiscountPrice',
      'Stock',
      'OffersAllowed',
      'ProductType',
      'Description',
      'ImageURL'
    ];

    const demoRows = SAMPLE_50_FLOWER_ITEMS.slice(0, 10).map((row) => [
      `"${row.name.replace(/"/g, '""')}"`,
      `"${row.category}"`,
      `"${row.sku}"`,
      row.price,
      row.discountedPrice || '',
      row.stock,
      row.offersAllowed ? 'Yes' : 'No',
      `"${row.productType}"`,
      `"${row.description.replace(/"/g, '""')}"`,
      `"${row.image}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...demoRows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `giftshop_products_demo_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(
      locale === 'ar'
        ? 'تم تحميل نموذج ملف Google Sheets / Excel التجريبي بنجاح'
        : 'Demo CSV template downloaded! You can open it in Google Sheets or Excel.',
      'success'
    );
  };

  // 2. Download Full 50-Item Flowers Catalog Demo File
  const handleDownload50CatalogCsv = () => {
    const headers = [
      'Name',
      'Category',
      'SKU',
      'Price',
      'DiscountPrice',
      'Stock',
      'OffersAllowed',
      'ProductType',
      'Description',
      'ImageURL'
    ];

    const fullRows = SAMPLE_50_FLOWER_ITEMS.map((row) => [
      `"${row.name.replace(/"/g, '""')}"`,
      `"${row.category}"`,
      `"${row.sku}"`,
      row.price,
      row.discountedPrice || '',
      row.stock,
      row.offersAllowed ? 'Yes' : 'No',
      `"${row.productType}"`,
      `"${row.description.replace(/"/g, '""')}"`,
      `"${row.image}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...fullRows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `50_flowers_products_ready_for_giftshop.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(
      locale === 'ar'
        ? 'تم تحميل كتالوج 50 منتج ورود جاهز للاستيراد'
        : 'Downloaded complete 50-product flowers catalog ready for import!',
      'success'
    );
  };

  // 3. One-Click Instant Load 50 Demo Products
  const handleLoadDemo50Direct = () => {
    setParsedRows(SAMPLE_50_FLOWER_ITEMS);
    setUploadFileName('50_flowers_catalog_ready.csv');
    toast(
      locale === 'ar'
        ? 'تم تجهيز 50 منتج ورود للمعاينة والرفع بنجاح'
        : 'Loaded 50 floral products into preview! Click "Import to Catalog" to commit.',
      'info'
    );
  };

  // 4. File Drag & Drop / File Select Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseCsvFile(file);
  };

  const parseCsvFile = (file: File) => {
    setUploadFileName(file.name);
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = (evt.target?.result as string) || '';
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast(locale === 'ar' ? 'الملف لا يحتوي على بيانات كافية' : 'CSV contains no rows', 'error');
          setIsProcessing(false);
          return;
        }

        // Basic CSV parsing handling quotes
        const parseRow = (line: string): string[] => {
          const cells: string[] = [];
          let insideQuote = false;
          let entry = '';
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
              cells.push(entry.trim());
              entry = '';
            } else {
              entry += char;
            }
          }
          cells.push(entry.trim());
          return cells.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
        };

        const rows: ParsedProductRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseRow(lines[i]);
          if (!cols[0]) continue;
          const name = cols[0];
          const category = cols[1] || 'Luxury Hand Bouquets';
          const sku = cols[2] || `SKU-${Date.now().toString().slice(-4)}-${i}`;
          const price = parseFloat(cols[3]) || 150;
          const discountedPrice = cols[4] ? parseFloat(cols[4]) : undefined;
          const stock = parseInt(cols[5], 10) || 20;
          const offersAllowed = (cols[6] || '').toLowerCase() !== 'no';
          const productType = cols[7] || 'Physical';
          const description = cols[8] || 'Premium fresh flower arrangement.';
          const image = cols[9] && cols[9].startsWith('http')
            ? cols[9]
            : SAMPLE_50_FLOWER_ITEMS[(i - 1) % SAMPLE_50_FLOWER_ITEMS.length].image;

          rows.push({
            name,
            category,
            sku,
            price,
            discountedPrice,
            stock,
            offersAllowed,
            productType,
            description,
            image
          });
        }

        setParsedRows(rows);
        toast(
          locale === 'ar'
            ? `تم تحليل ${rows.length} منتج بنجاح من الملف`
            : `Successfully parsed ${rows.length} products from ${file.name}`,
          'success'
        );
      } catch (err: any) {
        toast(err.message || 'Error parsing CSV', 'error');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  // 5. Commit Import to Tenant Context
  const handleCommitImport = () => {
    if (parsedRows.length === 0) {
      toast(locale === 'ar' ? 'لا توجد منتجات للاستيراد' : 'No products to import', 'error');
      return;
    }

    const newProducts: Omit<Product, 'id' | 'storeId' | 'publishedAt' | 'isStale'>[] = parsedRows.map((r) => ({
      name: r.name,
      nameAr: r.nameAr || r.name,
      sku: r.sku,
      category: r.category,
      price: r.price,
      discountedPrice: r.discountedPrice || null,
      stock: r.stock,
      status: 'published',
      isActive: true,
      image: r.image,
      tags: r.offersAllowed ? ['offers_allowed', 'bulk_imported'] : ['bulk_imported', 'no_offers'],
      productType: r.productType,
      description: r.description,
      descriptionAr: r.description,
      requiresShipping: true,
      trackInventory: true
    }));

    onImportProducts(newProducts);
    toast(
      locale === 'ar'
        ? `🎉 تم بنجاح رفع واستيراد ${newProducts.length} منتج إلى المتجر!`
        : `🎉 Successfully imported ${newProducts.length} products to ${storeName}!`,
      'success'
    );
    onClose();
  };

  // 6. Export Current Products to CSV
  const handleExportExistingProducts = () => {
    if (currentProducts.length === 0) {
      toast(locale === 'ar' ? 'لا توجد منتجات للتصدير' : 'No existing products to export', 'error');
      return;
    }

    const headers = [
      'Name',
      'Category',
      'SKU',
      'Price',
      'DiscountPrice',
      'Stock',
      'Status',
      'OffersAllowed',
      'ProductType',
      'Description',
      'ImageURL'
    ];

    const rows = currentProducts.map((p) => {
      const offersAllowed = !p.tags?.includes('no_offers');
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || 'General'}"`,
        `"${p.sku}"`,
        p.price,
        p.discountedPrice || '',
        p.stock,
        `"${p.status}"`,
        offersAllowed ? 'Yes' : 'No',
        `"${p.productType || 'Physical'}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        `"${p.image || ''}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${storeName.replace(/\s+/g, '_')}_products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(
      locale === 'ar'
        ? `تم تصدير ${currentProducts.length} منتج بنجاح إلى ملف CSV`
        : `Exported ${currentProducts.length} products to CSV file!`,
      'success'
    );
  };

  return (
    <div
      dir={dir}
      lang={locale}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden"
        style={{
          background: 'var(--surface, #ffffff)',
          borderColor: 'var(--border, #e2e8f0)',
          color: 'var(--text, #0f172a)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <span>{locale === 'ar' ? 'استيراد وتصدير المنتجات بالجملة' : 'Bulk Products Import & Export'}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  50+ Products
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {locale === 'ar'
                  ? 'رفع ملف CSV متوافق مع Google Sheets أو Excel بضغطة واحدة وتحديد الأسعار والخصومات والأكواد'
                  : 'Import / Export 50+ products via Google Sheet or Excel CSV with custom categories, SKU, stock & discount codes'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b bg-slate-50/30 dark:bg-slate-900/30 text-xs font-bold">
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{locale === 'ar' ? 'رفع واستيراد المنتجات (CSV / Sheets)' : 'Bulk Upload & Import'}</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{locale === 'ar' ? 'تصدير المنتجات الحالية (Export CSV)' : 'Export Catalog to CSV'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'import' ? (
            <>
              {/* Top Action Cards: Download Template / Instant 50 Items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Download Demo Google Sheet template */}
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {locale === 'ar' ? 'تحميل نموذج Google Sheet / Excel' : 'Download Demo Sheet Template'}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {locale === 'ar'
                        ? 'نموذج CSV جاهز لتعديله في Google Sheets أو Excel ثم تصديره'
                        : 'Clean template with header columns: Title, Category, SKU, Price, Discount, Stock, Offers.'}
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadDemoTemplate}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{locale === 'ar' ? 'تحميل ملف CSV التجريبي' : 'Download Sample CSV'}</span>
                  </button>
                </div>

                {/* 2. Download 50 Items Catalog */}
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Step 2 (Demo)</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {locale === 'ar' ? 'تحميل 50 منتج ورود جاهزة' : 'Download 50 Flowers Ready CSV'}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {locale === 'ar'
                        ? 'ملف يحتوي على 50 منتج ورود وهدايا حقيقي بأسعار وصور وSKU وتصنيفات'
                        : 'Download pre-filled 50 flowers catalog CSV to inspect or customize.'}
                    </p>
                  </div>
                  <button
                    onClick={handleDownload50CatalogCsv}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>{locale === 'ar' ? 'تحميل 50 منتج CSV' : 'Download 50 Products CSV'}</span>
                  </button>
                </div>

                {/* 3. 1-Click Fast Preview 50 Items */}
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      ⚡ Quick 1-Click Test
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {locale === 'ar' ? 'معاينة ورفع 50 منتج فوراً' : '1-Click Load 50 Flowers Catalog'}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {locale === 'ar'
                        ? 'تجاوز رفع الملف وقم بتعبئة 50 منتج ورود وهدايا فخمة مباشرة بنقرة واحدة!'
                        : 'Instantly populate 50 luxury flowers and gift items into the preview table.'}
                    </p>
                  </div>
                  <button
                    onClick={handleLoadDemo50Direct}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'تجهيز 50 منتج الآن' : 'Load 50 Products Now'}</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {uploadFileName
                      ? `${locale === 'ar' ? 'الملف المحدد:' : 'Selected File:'} ${uploadFileName}`
                      : locale === 'ar'
                      ? 'اسحب وأفلت ملف CSV هنا، أو انقر للاختيار'
                      : 'Drag & Drop CSV file here, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {locale === 'ar'
                      ? 'يدعم ملفات CSV المصدرة من Google Sheets أو Microsoft Excel حتى 50+ منتج'
                      : 'Supports .CSV format from Google Sheets or Excel (up to 50+ items at once)'}
                  </p>
                </div>
              </div>

              {/* Preview Table if rows exist */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {locale === 'ar'
                          ? `جاهز للرفع: ${parsedRows.length} منتج مصنف`
                          : `Ready for Import: ${parsedRows.length} Products Parsed`}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setParsedRows([]);
                        setUploadFileName('');
                      }}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      {locale === 'ar' ? 'مسح المعاينة' : 'Clear Preview'}
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-xs text-left rtl:text-right">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">{locale === 'ar' ? 'المنتج والصورة' : 'Product & Image'}</th>
                          <th className="py-2.5 px-3">{locale === 'ar' ? 'التصنيف' : 'Category'}</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">{locale === 'ar' ? 'السعر' : 'Price'}</th>
                          <th className="py-2.5 px-3">{locale === 'ar' ? 'سعر الخصم' : 'Discount'}</th>
                          <th className="py-2.5 px-3">{locale === 'ar' ? 'المخزون' : 'Stock'}</th>
                          <th className="py-2.5 px-3">{locale === 'ar' ? 'كود العرض' : 'Offers Allowed'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={row.image}
                                  alt={row.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                  onError={(e) => {
                                    (e.target as any).src =
                                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=120&q=80';
                                  }}
                                />
                                <span className="font-semibold line-clamp-1 max-w-[200px]" title={row.name}>
                                  {row.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                                {row.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{row.sku}</td>
                            <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-100">
                              {money(row.price)}
                            </td>
                            <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                              {row.discountedPrice ? money(row.discountedPrice) : '—'}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">
                              {row.stock}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.offersAllowed
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {row.offersAllowed ? 'Allowed' : 'No Offers'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Export Existing Tab */
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {locale === 'ar' ? 'تصدير كتالوج المنتجات الحالي' : 'Export Current Store Catalog'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {locale === 'ar'
                    ? `سيتم تصدير جميع منتجات متجر ${storeName} البالغ عددها ${currentProducts.length} منتج إلى ملف CSV يحتوي على الأسعار، الخصومات، كود العرض، روابط الصور، والمخزون.`
                    : `Export all ${currentProducts.length} products currently active in ${storeName} to a CSV file ready for Google Sheets or Excel.`}
                </p>
              </div>

              <div className="inline-flex items-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs">
                <div className="text-left rtl:text-right">
                  <span className="block font-bold text-slate-700 dark:text-slate-200">
                    {locale === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600">{currentProducts.length}</span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="text-left rtl:text-right">
                  <span className="block font-bold text-slate-700 dark:text-slate-200">
                    {locale === 'ar' ? 'المتجر المستهدف' : 'Target Store'}
                  </span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{storeName}</span>
                </div>
              </div>

              <div>
                <button
                  onClick={handleExportExistingProducts}
                  className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {locale === 'ar'
                      ? `تحميل ملف CSV (${currentProducts.length} منتج)`
                      : `Download CSV Catalog (${currentProducts.length} Items)`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {activeTab === 'import' && parsedRows.length > 0 && (
              <span>
                {locale === 'ar'
                  ? `سيتم إضافة ${parsedRows.length} منتج إلى المتجر الحالي (${storeName})`
                  : `Adding ${parsedRows.length} products to active store catalog`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>

            {activeTab === 'import' && (
              <button
                onClick={handleCommitImport}
                disabled={parsedRows.length === 0}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {locale === 'ar'
                    ? `تأكيد ورفع ${parsedRows.length} منتج إلى المتجر`
                    : `Confirm & Import ${parsedRows.length} Products`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
