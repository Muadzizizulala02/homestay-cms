import type { Accommodation } from '../types/accommodation.types';
import type { SiteSettings } from '../types/site-settings.types';

/**
 * Neutral first-day content for a brand-new site, so the public pages are not empty before the
 * owner has written their own. Deliberately says nothing the owner has not told us: no address,
 * phone, email, prices, photos, refund terms or notices. Those must be entered in the admin.
 * (Rooms are separate: see STARTER_ROOMS below, which are clearly-labelled placeholders.)
 *
 * Wording is written to be true of almost any homestay, and every line is editable under
 * Admin > Site content. The owner should still read it all before launch.
 */
export const STARTER_CONTENT: Omit<SiteSettings, 'updatedAt'> = {
  heroHeadline: 'Our Homestay',
  heroSubheadline: 'A comfortable place to stay. Choose your dates to see which rooms are free.',
  heroImageUrl: '',
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
  seoDefaults: { title: 'Homestay', description: '', shareImageUrl: '' },
};

/** The photo host for the placeholder images below (Unsplash CDN; the Unsplash licence allows this use). */
const STOCK = 'https://images.unsplash.com/photo-';

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
    photos: [`${STOCK}1595526114035-0d45ed16cfbf?w=1200&q=80`, `${STOCK}1522771739844-6a9f6d5f14af?w=1200&q=80`],
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
    photos: [
      `${STOCK}1522708323590-d24dbb6b0267?w=1200&q=80`,
      `${STOCK}1560448204-e02f11c3d0e2?w=1200&q=80`,
      `${STOCK}1505691938895-1758d7feb511?w=1200&q=80`,
    ],
    capacity: 4,
    beds: 2,
    amenities: ['Wi-Fi', 'Air-conditioning', 'Fresh linen and towels'],
    basePrice: 250,
    minStay: 1,
    maxStay: 14,
    active: true,
  },
];
