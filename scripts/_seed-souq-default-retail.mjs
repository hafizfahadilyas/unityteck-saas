import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const STORE_ID = 'store-souq-default';

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT || 3306),
    ssl: { rejectUnauthorized: false }
  });
  console.log('Connected to MySQL');

  // Check columns of stores
  const [storeCols] = await c.query('SHOW COLUMNS FROM stores');
  const storeColNames = storeCols.map(r => r.Field);
  console.log('stores columns:', storeColNames);

  // Check columns of products
  const [prodCols] = await c.query('SHOW COLUMNS FROM products');
  const prodColNames = prodCols.map(r => r.Field);
  console.log('products columns:', prodColNames);

  // Check columns of categories
  const [catCols] = await c.query('SHOW COLUMNS FROM categories');
  const catColNames = catCols.map(r => r.Field);
  console.log('categories columns:', catColNames);

  // 1. Update store logo / branding
  const retailLogo = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80';
  await c.query(
    'UPDATE stores SET logo = ?, name = ?, name_ar = ?, name_en = ? WHERE id = ?',
    ['', 'متجر سوق الافتراضي', 'متجر سوق الافتراضي', 'Souq Default Store', STORE_ID]
  );
  console.log('✓ Updated store basic info');

  // 2. Clean up old coffee-machine products for store-souq-default
  await c.query('DELETE FROM products WHERE store_id = ?', [STORE_ID]);
  console.log('✓ Cleared old products for store-souq-default');

  // 3. Insert 4 clean retail products
  const retailProducts = [
    {
      id: 'prod-souq-01',
      name: 'ساعة يد كلاسيكية فاخرة',
      name_ar: 'ساعة يد كلاسيكية فاخرة',
      name_en: 'Minimalist Classic Watch',
      description: 'ساعة كلاسيكية بتصميم أنيق وميناء أبيض ناصع مع حزام جلدي طبيعي عالي الجودة ومقاومة للماء حتى عمق 30 متراً.',
      description_ar: 'ساعة كلاسيكية بتصميم أنيق وميناء أبيض ناصع مع حزام جلدي طبيعي عالي الجودة ومقاومة للماء حتى عمق 30 متراً.',
      description_en: 'Minimalist classic wristwatch with a genuine leather strap, white dial, and 30m water resistance.',
      price: 199.00,
      original_price: 269.00,
      cost: 95.00,
      category: 'ساعات وإكسسوارات',
      category_ar: 'ساعات وإكسسوارات',
      category_en: 'Watches & Accessories',
      sku: 'SOUQ-WATCH-01',
      inventory: 50,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80']),
      status: 'published',
      is_active: 1,
      featured: 1,
      rating: 4.9,
      reviews_count: 24,
      badge: 'الأكثر طلباً',
      badge_ar: 'الأكثر طلباً',
      badge_en: 'Best Seller'
    },
    {
      id: 'prod-souq-02',
      name: 'سماعات رأس لاسلكية عازلة للضوضاء',
      name_ar: 'سماعات رأس لاسلكية عازلة للضوضاء',
      name_en: 'Wireless Noise-Cancelling Headphones',
      description: 'سماعات رأس بلوتوث بصوت عالي الدقة وتقنية إلغاء الضوضاء النشطة، بطارية تدوم حتى 40 ساعة تشغيل متواصل وسرعة شحن فائقة.',
      description_ar: 'سماعات رأس بلوتوث بصوت عالي الدقة وتقنية إلغاء الضوضاء النشطة، بطارية تدوم حتى 40 ساعة تشغيل متواصل وسرعة شحن فائقة.',
      description_en: 'Premium Bluetooth over-ear headphones with active noise cancellation, high-fidelity sound, and 40-hour battery life.',
      price: 299.00,
      original_price: 399.00,
      cost: 150.00,
      category: 'إلكترونيات وأجهزة',
      category_ar: 'إلكترونيات وأجهزة',
      category_en: 'Electronics & Audio',
      sku: 'SOUQ-HEADPHONE-02',
      inventory: 35,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80']),
      status: 'published',
      is_active: 1,
      featured: 1,
      rating: 5.0,
      reviews_count: 38,
      badge: 'مميز',
      badge_ar: 'مميز',
      badge_en: 'Featured'
    },
    {
      id: 'prod-souq-03',
      name: 'نظارة شمسية عصرية بعدسات مستقطبة',
      name_ar: 'نظارة شمسية عصرية بعدسات مستقطبة',
      name_en: 'Premium Polarized Sunglasses',
      description: 'نظارة شمسية بإطار متين وعدسات مستقطبة تحمي بنسبة 100% من الأشعة فوق البنفسجية UV400، مع علبة فاخرة ومنديل تنظيف مايكروفايبر.',
      description_ar: 'نظارة شمسية بإطار متين وعدسات مستقطبة تحمي بنسبة 100% من الأشعة فوق البنفسجية UV400، مع علبة فاخرة ومنديل تنظيف مايكروفايبر.',
      description_en: 'Designer polarized sunglasses featuring 100% UV400 protection, lightweight durable frame, and luxury hard case.',
      price: 149.00,
      original_price: 199.00,
      cost: 65.00,
      category: 'ساعات وإكسسوارات',
      category_ar: 'ساعات وإكسسوارات',
      category_en: 'Watches & Accessories',
      sku: 'SOUQ-SUNGLASS-03',
      inventory: 60,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80']),
      status: 'published',
      is_active: 1,
      featured: 1,
      rating: 4.8,
      reviews_count: 17,
      badge: 'وصل حديثاً',
      badge_ar: 'وصل حديثاً',
      badge_en: 'New Arrival'
    },
    {
      id: 'prod-souq-04',
      name: 'صندوق هدايا تنفيذي فاخر',
      name_ar: 'صندوق هدايا تنفيذي فاخر',
      name_en: 'Luxury Executive Gift Box',
      description: 'طقم هدية متكامل يشمل مفكرة جلدية فاخرة، قلم معدني مذهب، محفظة بطاقات، وحافظة مفاتيح بتغليف هدايا راقي وشريط ساتان.',
      description_ar: 'طقم هدية متكامل يشمل مفكرة جلدية فاخرة، قلم معدني مذهب، محفظة بطاقات، وحافظة مفاتيح بتغليف هدايا راقي وشريط ساتان.',
      description_en: 'Executive corporate gift set including luxury leather notebook, premium pen, cardholder, and keepsake box.',
      price: 249.00,
      original_price: 320.00,
      cost: 110.00,
      category: 'هدايا ومجموعات راقية',
      category_ar: 'هدايا ومجموعات راقية',
      category_en: 'Luxury Gifts & Sets',
      sku: 'SOUQ-GIFTBOX-04',
      inventory: 40,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify(['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80']),
      status: 'published',
      is_active: 1,
      featured: 1,
      rating: 4.9,
      reviews_count: 31,
      badge: 'عرض حصري',
      badge_ar: 'عرض حصري',
      badge_en: 'Exclusive'
    }
  ];

  for (const p of retailProducts) {
    const fields = ['id', 'store_id'];
    const values = [p.id, STORE_ID];

    for (const [key, val] of Object.entries(p)) {
      if (key === 'id') continue;
      if (prodColNames.includes(key)) {
        fields.push(key);
        values.push(val);
      }
    }

    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO products (${fields.join(', ')}) VALUES (${placeholders})`;
    await c.query(sql, values);
    console.log(`✓ Inserted product: ${p.name_en}`);
  }

  // 4. Clean up old categories & insert clean retail categories
  await c.query('DELETE FROM categories WHERE store_id = ?', [STORE_ID]);
  const retailCategories = [
    {
      id: 'cat-souq-01',
      store_id: STORE_ID,
      name: 'ساعات وإكسسوارات',
      name_ar: 'ساعات وإكسسوارات',
      name_en: 'Watches & Accessories',
      slug: 'watches-accessories',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      sort_order: 1,
      is_active: 1
    },
    {
      id: 'cat-souq-02',
      store_id: STORE_ID,
      name: 'إلكترونيات وأجهزة',
      name_ar: 'إلكترونيات وأجهزة',
      name_en: 'Electronics & Audio',
      slug: 'electronics-audio',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      sort_order: 2,
      is_active: 1
    },
    {
      id: 'cat-souq-03',
      store_id: STORE_ID,
      name: 'هدايا ومجموعات راقية',
      name_ar: 'هدايا ومجموعات راقية',
      name_en: 'Luxury Gifts & Sets',
      slug: 'luxury-gifts',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      sort_order: 3,
      is_active: 1
    }
  ];

  for (const cat of retailCategories) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(cat)) {
      if (catColNames.includes(key)) {
        fields.push(key);
        values.push(val);
      }
    }
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO categories (${fields.join(', ')}) VALUES (${placeholders})`;
    await c.query(sql, values);
    console.log(`✓ Inserted category: ${cat.name_en}`);
  }

  // 5. Update store_themes settings & builder_layouts to purge coffee machine banner
  const [bLayouts] = await c.query('SELECT * FROM builder_layouts WHERE store_id = ?', [STORE_ID]);
  console.log(`Found ${bLayouts.length} builder layout rows`);
  for (const bl of bLayouts) {
    let blocksStr = bl.blocks;
    if (typeof blocksStr === 'string' && blocksStr.includes('saudi_hero_banner_2')) {
      blocksStr = blocksStr.replace(/saudi_hero_banner_2\.(jpg|webp)/g, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80');
      await c.query('UPDATE builder_layouts SET blocks = ? WHERE store_id = ? AND theme_id = ?', [blocksStr, bl.store_id, bl.theme_id]);
      console.log(`✓ Sanitized builder_layout blocks for ${bl.theme_id}`);
    }
  }

  const [sThemes] = await c.query('SELECT * FROM store_themes WHERE store_id = ?', [STORE_ID]);
  console.log(`Found ${sThemes.length} store_themes rows`);
  for (const st of sThemes) {
    let settingsStr = st.settings;
    if (typeof settingsStr === 'string' && settingsStr.includes('saudi_hero_banner_2')) {
      settingsStr = settingsStr.replace(/saudi_hero_banner_2\.(jpg|webp)/g, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80');
      await c.query('UPDATE store_themes SET settings = ? WHERE id = ?', [settingsStr, st.id]);
      console.log(`✓ Sanitized store_themes settings for ${st.id}`);
    }
  }

  await c.end();
  console.log('\nSeeding and clean-up completed successfully!');
}

main().catch(console.error);
