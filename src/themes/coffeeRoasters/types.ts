export type Language = 'EN' | 'AR';
export type Currency = 'SAR' | 'USD';

export type CategoryId = 'all' | 'machines' | 'mills' | 'cabinets' | 'accessories' | 'offers';

export interface ProductColor {
  name: string;
  nameAr?: string;
  hex: string;
  image: string;
  priceDelta?: number;
}

export interface StorageOption {
  capacity: string;
  capacityAr?: string;
  ram: string;
  ramAr?: string;
  priceDelta: number;
}

export interface WarrantyOption {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
}

export interface BundleOption {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  originalPrice: number;
  image: string;
}

export interface ProductPartShowcase {
  id: string;
  tagEn: string;
  tagAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  stats?: { labelEn: string; labelAr: string; value: string }[];
}

export interface ProductHeroBanner {
  headlineEn: string;
  headlineAr: string;
  sloganEn: string;
  sloganAr: string;
  badgeEn?: string;
  badgeAr?: string;
  bgGradient: string;
  heroImage: string;
  featuresEn: string[];
  featuresAr: string[];
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  tagline: string;
  taglineAr?: string;
  category: CategoryId;
  basePrice: number;
  originalPrice?: number;
  badge?: string;
  badgeAr?: string;
  reviewCount: number;
  rating: number;
  colors: ProductColor[];
  storageOptions: StorageOption[];
  warranties?: WarrantyOption[];
  bundles?: BundleOption[];
  specs: { label: string; value: string; labelAr?: string; valueAr?: string }[];
  images: string[];
  overview: string;
  overviewAr?: string;
  partsShowcase?: ProductPartShowcase[];
  heroBanner?: ProductHeroBanner;
  sallaUrl?: string;
  specComparisonImage?: string;
  specComparisonImageAr?: string;
}

export interface CustomCornerOrderSpecs {
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  woodType: 'mdf' | 'chipboard';
  woodTypeName: string;
  woodTypeNameAr: string;
  edgeFinishing: string;
  edgeFinishingAr: string;
  structureColor: {
    id: string;
    name: string;
    nameAr: string;
    hex: string;
    image: string;
  };
  surfaceType: 'alternative' | 'natural';
  surfaceTypeName: string;
  surfaceTypeNameAr: string;
  surfaceThickness?: string;
  surfaceThicknessAr?: string;
  marbleKind?: 'cast' | 'slab';
  marbleKindName?: string;
  marbleKindNameAr?: string;
  surfaceColor: {
    id: string;
    name: string;
    nameAr: string;
    image: string;
    hex?: string;
  };
  handleType: {
    id: string;
    name: string;
    nameAr: string;
    image: string;
  };
  internalDivision: {
    id: string;
    name: string;
    nameAr: string;
    image: string;
  };
  divisionNotes?: string;
  accessories: Array<{
    id: string;
    name: string;
    nameAr: string;
    quantity: number;
    unitPrice: number;
  }>;
  generalNotes?: string;
  orderMode: 'direct' | 'quotation';
  quoteReference?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  image: string;
  selectedColor: ProductColor;
  selectedStorage: StorageOption;
  selectedWarranty?: WarrantyOption;
  selectedBundles?: BundleOption[];
  customCornerSpecs?: CustomCornerOrderSpecs;
}

export interface HonorBannerEvent {
  id: string;
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  image: string;
}

export interface HonorTechnology {
  id: string;
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  image: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  image: string;
  videoUrl?: string;
  productId: string;
}

export interface CustomerReview {
  id: string;
  author: string;
  city: string;
  rating: number;
  date: string;
  productName: string;
  comment: string;
  verified: boolean;
}
