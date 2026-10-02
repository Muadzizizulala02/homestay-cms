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

/** The starter hero slideshow, in order; it starts with the hero photo. */
export const STARTER_HERO_PHOTO_IDS: readonly string[] = ['living-room', 'sofa-lounge', 'lounge-kitchen', 'bedroom'];

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
 * PLACEHOLDER contact details. They are deliberately impossible to mistake for real ones, so a
 * guest can never be sent to a stranger: the email uses the reserved example.com domain, the
 * phone number is an obviously fake pattern, there is no street address, and the social links
 * go to each platform's front page rather than to any account. The owner replaces all of them in
 * Admin > Site content.
 */
const PLACEHOLDER_EMAIL = 'hello@example.com';
const PLACEHOLDER_PHONE = '+60 12-000 0000';
const PLACEHOLDER_SOCIAL_LINKS: SiteSettings['socialLinks'] = [
  { platform: 'Facebook', url: 'https://www.facebook.com/' },
  { platform: 'Instagram', url: 'https://www.instagram.com/' },
  { platform: 'TikTok', url: 'https://www.tiktok.com/' },
];

const HOST_INTRO_EN =
  'Hello, and welcome. We look after our guests ourselves, so if you need anything during your stay, ' +
  'just ask and we will do our best to help.';
const HOST_INTRO_MS =
  'Selamat datang. Kami sendiri menjaga tetamu kami, jadi jika anda memerlukan apa-apa semasa menginap, ' +
  'beritahu sahaja dan kami akan cuba membantu.';

/**
 * PLACEHOLDER cancellation wording. It promises no amounts, percentages or deadlines (those are
 * the owner's decision to write). Replace it with your real policy in Admin > Site content.
 */
const CANCELLATION_EN =
  'If you need to change or cancel your booking, please contact us as early as you can and quote your booking ' +
  'reference. What applies depends on how close the dates are, and we will tell you when you get in touch.';
const CANCELLATION_MS =
  'Jika anda perlu menukar atau membatalkan tempahan, sila hubungi kami secepat mungkin dan nyatakan nombor ' +
  'rujukan tempahan anda. Apa yang terpakai bergantung pada kedekatan tarikh, dan kami akan maklumkan apabila anda menghubungi kami.';

/**
 * Plain-language STARTER policies. They describe only what this website really does (what a
 * booking collects, where it is kept, what the browser remembers) and say nothing about refunds,
 * fees or liability, which are the owner's decisions. They are a starting point, not legal advice:
 * the owner should read and adjust them (Admin > Site content) before launch.
 */
const PRIVACY_EN = [
  'What we collect',
  'When you book, we ask for your name, email address and phone number, and any notes you choose to add. We use these only to manage your booking and to contact you about your stay.',
  '',
  'Payments',
  "Where online payment is available, you pay on the payment provider's own page. We do not see or store your card or bank details.",
  '',
  'Who can see your details',
  'Your booking details are kept securely and are visible only to us. We do not sell them or use them for advertising.',
  '',
  'Your choices',
  'To see, correct or delete the details we hold about you, contact us using the details on our Contact page.',
  '',
  'What your browser remembers',
  'This site remembers your language choice and which notices you have closed. It does not use advertising cookies.',
  '',
  'Changes',
  'We may update this policy from time to time. The latest version is always on this page.',
].join('\n');

const TERMS_EN = [
  'Bookings',
  'A booking is confirmed once we confirm it, or once payment is received where online payment is available. Please keep your booking reference.',
  '',
  'Guests and your stay',
  'Only the guests named in the booking may stay overnight. Please follow the house rules on our FAQ page.',
  '',
  'Prices',
  'Prices are shown in Malaysian ringgit (RM) for the dates you choose.',
  '',
  'Changes and cancellations',
  'Contact us with your booking reference and we will help. Where we have published a cancellation policy, it is on our About page.',
  '',
  'Questions',
  'If anything in these terms is unclear, please contact us using the details on our Contact page.',
].join('\n');

const PRIVACY_MS = [
  'Maklumat yang kami kumpul',
  'Apabila anda menempah, kami meminta nama, alamat e-mel dan nombor telefon anda, serta sebarang catatan yang anda pilih untuk tambah. Kami menggunakannya hanya untuk menguruskan tempahan anda dan menghubungi anda tentang penginapan anda.',
  '',
  'Pembayaran',
  'Jika pembayaran dalam talian tersedia, anda membayar di halaman penyedia pembayaran itu sendiri. Kami tidak melihat atau menyimpan butiran kad atau bank anda.',
  '',
  'Siapa yang boleh melihat maklumat anda',
  'Butiran tempahan anda disimpan dengan selamat dan hanya boleh dilihat oleh kami. Kami tidak menjualnya atau menggunakannya untuk pengiklanan.',
  '',
  'Pilihan anda',
  'Untuk melihat, membetulkan atau memadam maklumat yang kami simpan tentang anda, hubungi kami melalui butiran di halaman Hubungi kami.',
  '',
  'Apa yang diingati pelayar anda',
  'Laman ini mengingati pilihan bahasa anda dan makluman yang telah anda tutup. Ia tidak menggunakan kuki pengiklanan.',
  '',
  'Perubahan',
  'Kami mungkin mengemas kini dasar ini dari semasa ke semasa. Versi terkini sentiasa ada di halaman ini.',
].join('\n');

const TERMS_MS = [
  'Tempahan',
  'Tempahan disahkan apabila kami mengesahkannya, atau apabila bayaran diterima jika pembayaran dalam talian tersedia. Sila simpan nombor rujukan tempahan anda.',
  '',
  'Tetamu dan penginapan anda',
  'Hanya tetamu yang dinamakan dalam tempahan dibenarkan bermalam. Sila patuhi peraturan rumah di halaman Soalan Lazim.',
  '',
  'Harga',
  'Harga dipaparkan dalam ringgit Malaysia (RM) untuk tarikh yang anda pilih.',
  '',
  'Perubahan dan pembatalan',
  'Hubungi kami dengan nombor rujukan tempahan anda dan kami akan membantu. Jika kami telah menerbitkan dasar pembatalan, ia terdapat di halaman Tentang Kami.',
  '',
  'Pertanyaan',
  'Jika sebarang perkara dalam terma ini kurang jelas, sila hubungi kami melalui butiran di halaman Hubungi kami.',
].join('\n');

/**
 * First-day content for a brand-new site, so the public pages are not empty before the owner has
 * written their own. Anything that is a fact about the business (contact details, social accounts,
 * cancellation terms) is a clearly-fake PLACEHOLDER, defined above; there is no street address,
 * no prices and no notices. Those must be entered in the admin. The only
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
  heroImages: STARTER_HERO_PHOTO_IDS.map(photoUrl),
  heroIntervalSeconds: 5,
  aboutContent:
    'We offer comfortable rooms for short and longer stays. Choose your dates to see which rooms are ' +
    'available, then book in a few steps.',
  hostIntro: HOST_INTRO_EN,
  address: '',
  geo: { lat: 0, lng: 0 },
  contactEmail: PLACEHOLDER_EMAIL,
  contactPhone: PLACEHOLDER_PHONE,
  socialLinks: PLACEHOLDER_SOCIAL_LINKS,
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
  cancellationPolicy: CANCELLATION_EN,
  privacyPolicy: PRIVACY_EN,
  termsAndConditions: TERMS_EN,
  notices: [],
  facilities: [
    { icon: 'wifi', label: 'Wi-Fi', description: '', labelMs: 'Wi-Fi', descriptionMs: '' },
    { icon: 'local_parking', label: 'Parking', description: '', labelMs: 'Tempat letak kereta', descriptionMs: '' },
    { icon: 'ac_unit', label: 'Air-conditioning', description: '', labelMs: 'Penyaman udara', descriptionMs: '' },
    { icon: 'bed', label: 'Fresh linen and towels', description: '', labelMs: 'Cadar dan tuala bersih', descriptionMs: '' },
  ],
  translations: {
    ms: {
      privacyPolicy: PRIVACY_MS,
      termsAndConditions: TERMS_MS,
      cancellationPolicy: CANCELLATION_MS,
      hostIntro: HOST_INTRO_MS,
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
  // No section photos by default: each home section keeps its own designed look until the owner adds one.
  sectionBackgrounds: {},
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
    id: 'starter-deluxe-room',
    slug: 'deluxe-room',
    name: 'Deluxe Room',
    description:
      'A roomier choice for up to three guests, with a seating area to relax in as well as a comfortable bed.',
    descriptionMs:
      'Pilihan yang lebih luas untuk sehingga tiga tetamu, dengan ruang duduk untuk berehat selain katil yang selesa.',
    photos: [photoUrl('sofa-lounge'), photoUrl('bed-detail')],
    capacity: 3,
    beds: 2,
    amenities: ['Wi-Fi', 'Air-conditioning', 'Fresh linen and towels'],
    basePrice: 200,
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
