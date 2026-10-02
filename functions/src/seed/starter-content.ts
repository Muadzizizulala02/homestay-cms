import type { Accommodation } from '../types/accommodation.types';
import type { SiteSettings } from '../types/site-settings.types';

/** Where the placeholder photos come from (Unsplash; its licence allows free use). */
const UNSPLASH = 'https://images.unsplash.com/photo-';

export interface StockPhoto {
  id: string;
  /** Original image URL. The seed script uploads it to the owner's Cloudinary and uses that copy. */
  sourceUrl: string;
  /** Accurate description, used as the gallery alt text. */
  altText: string;
}

/**
 * PLACEHOLDER photos (stock images, NOT this property). Each is described accurately so the alt
 * text is true even though the picture is not the owner's. Replace them in the admin.
 */
export const STARTER_PHOTOS: readonly StockPhoto[] = [
  {
    id: 'living-room',
    sourceUrl: `${UNSPLASH}1560448204-e02f11c3d0e2?w=1600&q=80`,
    altText: 'A bright open living room with large windows, a sofa and armchair, and a dining table',
  },
  {
    id: 'lounge-kitchen',
    sourceUrl: `${UNSPLASH}1522708323590-d24dbb6b0267?w=1600&q=80`,
    altText: 'A lounge with a red armchair and a sofa beside a small kitchen and dining table',
  },
  {
    id: 'bedroom',
    sourceUrl: `${UNSPLASH}1595526114035-0d45ed16cfbf?w=1600&q=80`,
    altText: 'A tidy white bedroom with a double bed, a window and a bedside table',
  },
  {
    id: 'bed-detail',
    sourceUrl: `${UNSPLASH}1522771739844-6a9f6d5f14af?w=1600&q=80`,
    altText: 'A bed with patterned cushions beside a wooden bedside table and a reading lamp',
  },
  {
    id: 'sofa-lounge',
    sourceUrl: `${UNSPLASH}1505691938895-1758d7feb511?w=1600&q=80`,
    altText: 'A cream sofa with blue cushions between two lamps, under a framed painting',
  },
];

/** Which stock photo is the hero (and the social-share image). */
export const STARTER_HERO_PHOTO_ID = 'living-room';

function photoUrl(id: string): string {
  const photo = STARTER_PHOTOS.find((p) => p.id === id);
  if (!photo) {
    throw new Error(`Unknown starter photo: ${id}`);
  }
  return photo.sourceUrl;
}

/** Gallery records to seed, one per stock photo, in display order. */
export const STARTER_GALLERY: ReadonlyArray<{ id: string; photoId: string; altText: string }> = STARTER_PHOTOS.map((photo) => ({
  id: `starter-gallery-${photo.id}`,
  photoId: photo.id,
  altText: photo.altText,
}));

/**
 * Neutral first-day content for a brand-new site, so the public pages are not empty before the
 * owner has written their own. Deliberately says nothing the owner has not told us: no address,
 * phone, email, prices, refund terms or notices. Those must be entered in the admin. The only
 * images are the clearly-labelled stock PLACEHOLDERS above (hero, gallery, rooms).
 * (Rooms are separate: see STARTER_ROOMS below, which are clearly-labelled placeholders.)
 *
 * Wording is written to be true of almost any homestay, and every line is editable under
 * Admin > Site content. The owner should still read it all before launch.
 */
export const STARTER_CONTENT: Omit<SiteSettings, 'updatedAt'> = {
  heroHeadline: 'Our Homestay',
  heroSubheadline: 'A comfortable place to stay. Choose your dates to see which rooms are free.',
  heroImageUrl: photoUrl(STARTER_HERO_PHOTO_ID),
  aboutContent:
    'We offer comfortable rooms for short and longer stays. Choose your dates to see which rooms are ' +
    'available, then book in a few steps.',
  hostIntro: '',
  address: '',
  geo: { lat: 0, lng: 0 },
  contactEmail: '',
  contactPhone: '',
  socialLinks: [],
  checkInTime: '14:00',
  checkOutTime: '12:00',
  houseRules: [
    'No smoking indoors.',
    'Please keep noise down from 11pm to 7am.',
    'Please remove your shoes before coming in.',
    'Only the guests named in the booking may stay overnight.',
  ],
  faqs: [
    {
      order: 0,
      question: 'How do I book?',
      answer:
        'Choose your check-in and check-out dates, pick a room that is free, and enter your details. ' +
        'You will see a booking reference when you are done.',
    },
    {
      order: 1,
      question: 'How do I check availability?',
      answer: 'Use the date bar on the home page, or open a room and pick your dates. We check availability before you book.',
    },
    {
      order: 2,
      question: 'How do I change or cancel my booking?',
      answer: 'Please contact us with your booking reference and we will help.',
    },
  ],
  cancellationPolicy: '',
  notices: [],
  facilities: [
    { icon: 'wifi', label: 'Wi-Fi', description: '', labelMs: 'Wi-Fi', descriptionMs: '' },
    { icon: 'local_parking', label: 'Parking', description: '', labelMs: 'Tempat letak kereta', descriptionMs: '' },
    { icon: 'ac_unit', label: 'Air-conditioning', description: '', labelMs: 'Penyaman udara', descriptionMs: '' },
    { icon: 'bed', label: 'Fresh linen and towels', description: '', labelMs: 'Cadar dan tuala bersih', descriptionMs: '' },
  ],
  translations: {
    ms: {
      heroHeadline: 'Homestay Kami',
      heroSubheadline: 'Tempat penginapan yang selesa. Pilih tarikh anda untuk melihat bilik yang masih kosong.',
      aboutContent:
        'Kami menyediakan bilik yang selesa untuk penginapan singkat dan panjang. Pilih tarikh anda untuk ' +
        'melihat bilik yang tersedia, kemudian tempah dalam beberapa langkah.',
      houseRules: [
        'Dilarang merokok di dalam rumah.',
        'Sila elakkan bising dari 11 malam hingga 7 pagi.',
        'Sila tanggalkan kasut sebelum masuk.',
        'Hanya tetamu yang dinamakan dalam tempahan dibenarkan bermalam.',
      ],
      faqs: [
        {
          order: 0,
          question: 'Bagaimana untuk menempah?',
          answer:
            'Pilih tarikh daftar masuk dan daftar keluar, pilih bilik yang kosong, kemudian isi maklumat anda. ' +
            'Anda akan melihat nombor rujukan tempahan apabila selesai.',
        },
        {
          order: 1,
          question: 'Bagaimana untuk menyemak ketersediaan?',
          answer:
            'Gunakan bar tarikh di laman utama, atau buka sesebuah bilik dan pilih tarikh anda. ' +
            'Kami menyemak ketersediaan sebelum anda menempah.',
        },
        {
          order: 2,
          question: 'Bagaimana untuk menukar atau membatalkan tempahan?',
          answer: 'Sila hubungi kami dengan nombor rujukan tempahan anda dan kami akan membantu.',
        },
      ],
    },
  },
  seoDefaults: { title: 'Homestay', description: '', shareImageUrl: photoUrl(STARTER_HERO_PHOTO_ID) },
};

/**
 * PLACEHOLDER rooms so a new site can show something bookable on day one. The photos are stock
 * images, NOT this property, and the prices are made-up sample figures: both must be replaced in
 * Admin > Accommodation before real guests book. Ids are fixed so re-running the seed skips
 * rooms that already exist instead of duplicating them.
 */
export const STARTER_ROOMS: ReadonlyArray<Omit<Accommodation, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'starter-standard-room',
    slug: 'standard-room',
    name: 'Standard Room',
    description: 'A comfortable room for one or two guests, with a bed, a bedside lamp and a window with natural light.',
    descriptionMs:
      'Bilik yang selesa untuk seorang atau dua tetamu, dengan katil, lampu tepi katil dan tingkap yang membawa cahaya semula jadi.',
    photos: [photoUrl('bedroom'), photoUrl('bed-detail')],
    capacity: 2,
    beds: 1,
    amenities: ['Wi-Fi', 'Air-conditioning', 'Fresh linen and towels'],
    basePrice: 150,
    minStay: 1,
    maxStay: 14,
    active: true,
  },
  {
    id: 'starter-family-room',
    slug: 'family-room',
    name: 'Family Room',
    description: 'A larger space for families and small groups, with room to sit together and a small kitchen area.',
    descriptionMs: 'Ruang yang lebih luas untuk keluarga dan kumpulan kecil, dengan tempat untuk duduk bersama dan ruang dapur kecil.',
    photos: [photoUrl('lounge-kitchen'), photoUrl('living-room'), photoUrl('sofa-lounge')],
    capacity: 4,
    beds: 2,
    amenities: ['Wi-Fi', 'Air-conditioning', 'Fresh linen and towels'],
    basePrice: 250,
    minStay: 1,
    maxStay: 14,
    active: true,
  },
];
