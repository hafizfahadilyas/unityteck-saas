/**
 * Replace old HiBrew group demo with a fresh parent + 3 children.
 * Each child gets a full Custom Fields suite (text, choice, color, size, upload, content, …)
 * so the single product / buy page can show every type.
 *
 * Target: central Hostinger MySQL (store-coffee / mieraf-ksa.com)
 * Usage: node scripts/seed-hibrew-group-all-custom-fields.mjs
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const STORE_ID = 'store-coffee';
const STAMP = 'cfdemo';
const PARENT_ID = `prod-grp-${STAMP}`;
const CHILD_IDS = [`prod-grp-c1-${STAMP}`, `prod-grp-c2-${STAMP}`, `prod-grp-c3-${STAMP}`];

const OLD_CHILD_SKUS = ['GRP-CHILD-SILVER', 'GRP-CHILD-GRINDER', 'GRP-CHILD-BLACK'];
const OLD_PARENT_SKUS = ['GRP-DEMO-01', 'GRP-DEMO'];
const OLD_ID_PREFIXES = ['prod-c1-yvdusf', 'prod-c2-', 'prod-c3-', 'prod-grp-demo', 'prod-grp-parent'];

function buildCustomFields(childKey) {
  const p = `cf-${STAMP}-${childKey}`;
  return [
    {
      id: `${p}-short`,
      name: 'Gift note',
      nameAr: 'ملاحظة الهدية',
      description: 'Short text for the gift card.',
      type: 'Short Text',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-long`,
      name: 'Special instructions',
      nameAr: 'تعليمات خاصة',
      description: 'Long text for delivery / setup notes.',
      type: 'Long Text',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-number`,
      name: 'Quantity of cups',
      nameAr: 'عدد الأكواب',
      type: 'Number',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-single-text`,
      name: 'Extraction Profile',
      nameAr: 'ملف الاستخلاص',
      description: 'Single Choice – Text',
      type: 'Single Choice',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [
        { label: 'Standard 15 Bar', labelAr: 'قياسي 15 بار', price: 0 },
        { label: 'Commercial 20 Bar', labelAr: 'تجاري 20 بار', price: 49 },
        { label: 'Turbo Bloom', labelAr: 'تيربو بلوم', price: 99, compareAtPrice: 149 },
      ],
    },
    {
      id: `${p}-single-img`,
      name: 'Care Package',
      nameAr: 'باقة العناية',
      description: 'Single Choice – Image',
      type: 'Single Choice Image',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [
        {
          label: 'Care Pro 1 Year',
          labelAr: 'عناية برو لسنة',
          imageUrl: '/images/hibrew_scale_isolated.jpg',
          price: 99,
          compareAtPrice: 199,
        },
        {
          label: 'Care Pro 2 Years',
          labelAr: 'عناية برو لسنتين',
          imageUrl: '/images/hibrew_barista_kit_isolated.jpg',
          price: 179,
          compareAtPrice: 299,
        },
      ],
    },
    {
      id: `${p}-single-color`,
      name: 'Machine color',
      nameAr: 'لون الماكينة',
      description: 'Single Choice – Color',
      type: 'Single Choice Color',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [
        { label: 'Silver', labelAr: 'فضي', color: '#C0C0C0', price: 0 },
        { label: 'Black', labelAr: 'أسود', color: '#111111', price: 49 },
        { label: 'Copper', labelAr: 'نحاسي', color: '#B87333', price: 79 },
      ],
    },
    {
      id: `${p}-multi-text`,
      name: 'Extra services',
      nameAr: 'خدمات إضافية',
      description: 'Multiple Choice – Text',
      type: 'Multiple Choice',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [
        { label: 'Express setup', labelAr: 'تركيب سريع', price: 49 },
        { label: 'Training session', labelAr: 'جلسة تدريب', price: 99 },
      ],
    },
    {
      id: `${p}-multi-img`,
      name: 'Barista Add-on Offers',
      nameAr: 'عروض إضافات الباريستا',
      description: 'Multiple Choice – Image',
      type: 'Multiple Choice Image',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [
        {
          label: 'Precision Tamper',
          labelAr: 'تامبر دقيق',
          imageUrl: '/images/hibrew_barista_kit_isolated.jpg',
          price: 99,
          compareAtPrice: 199,
        },
        {
          label: 'Digital Scale',
          labelAr: 'ميزان رقمي',
          imageUrl: '/images/hibrew_scale_isolated.jpg',
          price: 79,
          compareAtPrice: 149,
        },
        {
          label: 'Milk Pitcher',
          labelAr: 'إبريق الحليب',
          imageUrl: '/images/espresso_wood_pitcher_1791363392554.jpg',
          price: 49,
          compareAtPrice: 99,
        },
      ],
    },
    {
      id: `${p}-multi-color`,
      name: 'Accent colors',
      nameAr: 'ألوان إضافية',
      description: 'Multiple Choice – Color',
      type: 'Multiple Choice Color',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [
        { label: 'Teal', labelAr: 'تيل', color: '#1d8b94', price: 19 },
        { label: 'Gold', labelAr: 'ذهبي', color: '#D4AF37', price: 29 },
        { label: 'Rose', labelAr: 'وردي', color: '#e11d48', price: 29 },
      ],
    },
    {
      id: `${p}-img-upload`,
      name: 'Upload logo',
      nameAr: 'رفع الشعار',
      description: 'Image Upload',
      type: 'Image Upload',
      required: false,
      hidden: false,
      extraPrice: 25,
      options: [],
    },
    {
      id: `${p}-file-upload`,
      name: 'Upload PDF brief',
      nameAr: 'رفع ملف PDF',
      description: 'File Upload',
      type: 'File Upload',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-date`,
      name: 'Delivery date',
      nameAr: 'تاريخ التوصيل',
      type: 'Date',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-time`,
      name: 'Preferred time',
      nameAr: 'الوقت المفضل',
      type: 'Time',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-datetime`,
      name: 'Install slot',
      nameAr: 'موعد التركيب',
      type: 'Date and Time',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-location`,
      name: 'Install city',
      nameAr: 'مدينة التركيب',
      type: 'Location',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-color-picker`,
      name: 'Custom paint',
      nameAr: 'طلاء مخصص',
      description: 'Color Picker',
      type: 'Color Selector',
      required: false,
      hidden: false,
      extraPrice: 120,
      options: [],
    },
    {
      id: `${p}-size`,
      name: 'Counter size',
      nameAr: 'مقاس الركن',
      description: 'Size Selector',
      type: 'Size Selector',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [
        { label: 'S', labelAr: 'صغير', price: 0 },
        { label: 'M', labelAr: 'وسط', price: 49 },
        { label: 'L', labelAr: 'كبير', price: 99 },
      ],
    },
    {
      id: `${p}-divider`,
      name: 'Divider',
      nameAr: 'فاصل',
      type: 'Divider',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
    },
    {
      id: `${p}-content`,
      name: 'Why this model',
      nameAr: 'لماذا هذا الموديل',
      description: 'Content block on the buy page',
      type: 'Content',
      required: false,
      hidden: false,
      extraPrice: 0,
      options: [],
      contentEn: `This ${childKey} edition includes full custom fields demo for HiBrew KSA.`,
      contentAr: `هذا الموديل (${childKey}) يعرض كل أنواع الحقول المخصصة في هايبرو السعودية.`,
      imageUrl: '/images/hibrew_h7a_flagship_machine.png',
    },
  ];
}

const CHILDREN = [
  {
    id: CHILD_IDS[0],
    key: 'silver',
    name: 'HiBrew Silver Pro',
    nameAr: 'هايبرو سيلفر برو',
    sku: 'GRP-CF-SILVER',
    price: 1999,
    original: 2299,
    stock: 12,
    image: '/images/group_demo_child_silver.jpg',
  },
  {
    id: CHILD_IDS[1],
    key: 'grinder',
    name: 'HiBrew Precision Grinder',
    nameAr: 'طاحونة هايبرو الدقيقة',
    sku: 'GRP-CF-GRINDER',
    price: 749,
    original: 899,
    stock: 18,
    image: '/images/hibrew_scale_isolated.jpg',
  },
  {
    id: CHILD_IDS[2],
    key: 'black',
    name: 'HiBrew Compact Black',
    nameAr: 'هايبرو كومباكت أسود',
    sku: 'GRP-CF-BLACK',
    price: 399,
    original: 549,
    stock: 20,
    image: '/images/hibrew_h7a_flagship_machine.png',
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
  });

  console.log('Connected', process.env.DB_HOST, process.env.DB_DATABASE);

  // Ensure group members table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_group_members (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      store_id VARCHAR(64) NOT NULL,
      parent_product_id VARCHAR(64) NOT NULL,
      child_product_id VARCHAR(64) NOT NULL,
      sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      selector_image_url TEXT NULL,
      created_at TIMESTAMP NULL DEFAULT NULL,
      updated_at TIMESTAMP NULL DEFAULT NULL,
      UNIQUE KEY pgm_store_parent_child_uq (store_id, parent_product_id, child_product_id),
      UNIQUE KEY pgm_store_child_uq (store_id, child_product_id),
      KEY pgm_store_parent_sort_idx (store_id, parent_product_id, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Find old demo rows
  const [oldRows] = await conn.query(
    `SELECT id, sku, name, product_type FROM products
     WHERE store_id = ?
       AND (
         sku IN (?)
         OR sku IN (?)
         OR id IN (?)
         OR id LIKE 'prod-c1-yvdusf%'
         OR id LIKE 'prod-c2-yvdusf%'
         OR id LIKE 'prod-c3-yvdusf%'
         OR id LIKE 'prod-grp-demo%'
         OR sku LIKE 'GRP-CHILD-%'
         OR sku LIKE 'GRP-DEMO%'
         OR id IN (?)
         OR id LIKE 'prod-grp-${STAMP}%'
       )`,
    [STORE_ID, OLD_CHILD_SKUS, OLD_PARENT_SKUS, OLD_ID_PREFIXES, [PARENT_ID, ...CHILD_IDS]],
  );

  const oldIds = [...new Set(oldRows.map((r) => r.id))];
  console.log('Old/demo rows to remove:', oldIds.length, oldIds);

  if (oldIds.length) {
    await conn.query(
      `DELETE FROM product_group_members WHERE store_id = ? AND (parent_product_id IN (?) OR child_product_id IN (?))`,
      [STORE_ID, oldIds, oldIds],
    );
    await conn.query(`DELETE FROM products WHERE store_id = ? AND id IN (?)`, [STORE_ID, oldIds]);
    console.log('Removed old group demo products');
  }

  // Also clear any membership pointing at our new ids
  await conn.query(
    `DELETE FROM product_group_members WHERE store_id = ? AND (parent_product_id = ? OR child_product_id IN (?))`,
    [STORE_ID, PARENT_ID, CHILD_IDS],
  );
  await conn.query(`DELETE FROM products WHERE store_id = ? AND id IN (?)`, [
    STORE_ID,
    [PARENT_ID, ...CHILD_IDS],
  ]);

  const now = new Date();
  const cols = [
    'id',
    'store_id',
    'name',
    'name_ar',
    'slug',
    'description',
    'price',
    'original_price',
    'sku',
    'stock',
    'product_type',
    'status',
    'is_active',
    'image_url',
    'gallery_urls',
    'tags',
    'category',
    'custom_fields',
    'created_at',
    'updated_at',
  ];

  // Detect optional columns
  const [colRows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'`,
    [process.env.DB_DATABASE],
  );
  const have = new Set(colRows.map((c) => c.COLUMN_NAME));

  async function insertProduct(row) {
    const useCols = cols.filter((c) => have.has(c));
    const placeholders = useCols.map(() => '?').join(',');
    const values = useCols.map((c) => {
      const v = row[c];
      if (v != null && typeof v === 'object' && !(v instanceof Date)) return JSON.stringify(v);
      return v;
    });
    await conn.query(
      `INSERT INTO products (${useCols.join(',')}) VALUES (${placeholders})`,
      values,
    );
  }

  await insertProduct({
    id: PARENT_ID,
    store_id: STORE_ID,
    name: 'HiBrew Custom Fields Group',
    name_ar: 'مجموعة حقول هايبرو المخصصة',
    slug: `hibrew-custom-fields-group-${STAMP}`,
    description: 'Grouped parent — open this page, switch children, all custom field types show on buy.',
    price: 0,
    original_price: 0,
    sku: 'GRP-CF-PARENT',
    stock: 0,
    product_type: 'grouped',
    status: 'published',
    is_active: 1,
    image_url: '/images/hibrew_h7a_flagship_machine.png',
    gallery_urls: ['/images/hibrew_h7a_flagship_machine.png'],
    tags: [],
    category: 'machines',
    custom_fields: [],
    created_at: now,
    updated_at: now,
  });
  console.log('Created parent', PARENT_ID);

  for (let i = 0; i < CHILDREN.length; i++) {
    const c = CHILDREN[i];
    const fields = buildCustomFields(c.key);
    await insertProduct({
      id: c.id,
      store_id: STORE_ID,
      name: `${c.name} (Group Child)`,
      name_ar: c.nameAr,
      slug: `hibrew-${c.key}-${STAMP}`,
      description: `Independent child ${c.key} with full custom fields suite.`,
      price: c.price,
      original_price: c.original,
      sku: c.sku,
      stock: c.stock,
      product_type: 'Physical Product',
      status: 'published',
      is_active: 1,
      image_url: c.image,
      gallery_urls: [c.image],
      tags: [],
      category: 'machines',
      custom_fields: fields,
      created_at: now,
      updated_at: now,
    });
    await conn.query(
      `INSERT INTO product_group_members
        (id, store_id, parent_product_id, child_product_id, sort_order, selector_image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `pgm-${STAMP}-${i}`,
        STORE_ID,
        PARENT_ID,
        c.id,
        i,
        c.image,
        now,
        now,
      ],
    );
    console.log('Created child', c.id, 'fields', fields.length);
  }

  await conn.end();
  console.log('DONE');
  console.log(`Parent: ${PARENT_ID} (SKU GRP-CF-PARENT)`);
  console.log(`Children: ${CHILD_IDS.join(', ')}`);
  console.log('Open storefront parent product page to see all custom field types on the selected child.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
