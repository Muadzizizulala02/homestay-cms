import type { SiteSettings } from '../types/site-settings.types';

/**
 * Neutral first-day content for a brand-new site, so the public pages are not empty before the
 * owner has written their own. Deliberately says nothing the owner has not told us: no address,
 * phone, email, prices, photos, refund terms or notices. Those must be entered in the admin.
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
