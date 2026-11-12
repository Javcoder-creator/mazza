const BRANCHES = [
  {
    id: 1,
    cityUz: 'Toshkent',
    cityRu: 'Ташкент',
    nameUz: 'MAZZA Chilonzor Flagman',
    nameRu: 'MAZZA Чиланзар Флагман',
    addressUz: 'Chilonzor tumani, Bunyodkor shoh ko\'chasi, 15A',
    addressRu: 'Чиланзарский район, проспект Бунёдкор, 15А',
    hours: '09:00 - 03:00',
    phone: '+998 71 200 70 70',
    featuresUz: ['24/7 Drive-Thru', 'Bolalar maydonchasi', 'Bepul Wi-Fi'],
    featuresRu: ['Авто-окно', 'Детская зона', 'Бесплатный Wi-Fi']
  },
  {
    id: 2,
    cityUz: 'Toshkent',
    cityRu: 'Ташкент',
    nameUz: 'MAZZA Amir Temur',
    nameRu: 'MAZZA Амир Темур',
    addressUz: 'Yunusobod tumani, Amir Temur ko\'chasi, 62',
    addressRu: 'Юнусабадский район, улица Амира Темура, 62',
    hours: '09:00 - 02:00',
    phone: '+998 71 200 70 71',
    featuresUz: ['Tezkor olib ketish', 'Oilaviy zal', 'Terassa'],
    featuresRu: ['Быстрый самовывоз', 'Семейный зал', 'Терраса']
  },
  {
    id: 3,
    cityUz: 'Toshkent',
    cityRu: 'Ташкент',
    nameUz: 'MAZZA Sergeli City',
    nameRu: 'MAZZA Сергели Сити',
    addressUz: 'Sergeli tumani, Yangi Sergeli ko\'chasi, 24',
    addressRu: 'Сергелийский район, улица Янги Сергели, 24',
    hours: '10:00 - 01:00',
    phone: '+998 71 200 70 72',
    featuresUz: ['Bolalar maydonchasi', 'Katta avtoturargoh'],
    featuresRu: ['Детская зона', 'Большая парковка']
  },
  {
    id: 4,
    cityUz: 'Samarqand',
    cityRu: 'Самарканд',
    nameUz: 'MAZZA Registon Avenue',
    nameRu: 'MAZZA Регистан Авеню',
    addressUz: 'Samarqand shahri, Universitet xiyoboni, 19',
    addressRu: 'г. Самарканд, Университетский бульвар, 19',
    hours: '09:00 - 01:00',
    phone: '+998 66 230 70 70',
    featuresUz: ['Markaziy joylashuv', 'Halol sertifikat', 'Bepul Wi-Fi'],
    featuresRu: ['Центральная локация', 'Сертификат Халяль', 'Бесплатный Wi-Fi']
  },
  {
    id: 5,
    cityUz: 'Farg\'ona',
    cityRu: 'Фергана',
    nameUz: 'MAZZA Farg\'ona Markaz',
    nameRu: 'MAZZA Фергана Центр',
    addressUz: 'Farg\'ona shahri, Al-Farg\'oniy ko\'chasi, 44',
    addressRu: 'г. Фергана, улица Аль-Фаргони, 44',
    hours: '09:00 - 00:00',
    phone: '+998 73 244 70 70',
    featuresUz: ['Oilaviy zal', 'Tezkor yetkazish'],
    featuresRu: ['Семейный зал', 'Быстрая доставка']
  }
];

const VACANCIES = [
  {
    id: 1,
    titleUz: 'Kuryer (Avto / Moto / Skuter)',
    titleRu: 'Курьер (Авто / Мото / Скутер)',
    salaryUz: '6 000 000 - 11 000 000 so\'m',
    salaryRu: '6 000 000 - 11 000 000 сум',
    scheduleUz: 'Moslashuvchan grafik (5/2 yoki 6/1)',
    scheduleRu: 'Гибкий график (5/2 или 6/1)',
    requirementsUz: 'Toshkent shahrini yaxshi bilish, mas\'uliyat va xushmuomalalik.',
    requirementsRu: 'Хорошее знание города, ответственность и вежливость.'
  },
  {
    id: 2,
    titleUz: 'Oshpaz / Lavash ustasi',
    titleRu: 'Повар / Мастер лаваша',
    salaryUz: '5 000 000 - 7 500 000 so\'m',
    salaryRu: '5 000 000 - 7 500 000 сум',
    scheduleUz: 'Smenali grafik, bepul tushlik va forma',
    scheduleRu: 'Сменный график, бесплатный обед и форма',
    requirementsUz: 'Tez tayyorlash istagi, gigiyena qoidalariga qat\'iy rioya qilish.',
    requirementsRu: 'Желание работать в быстром темпе, соблюдение санитарных норм.'
  },
  {
    id: 3,
    titleUz: 'Kassir-operator',
    titleRu: 'Кассир-оператор',
    salaryUz: '4 500 000 - 6 000 000 so\'m',
    salaryRu: '4 500 000 - 6 000 000 сум',
    scheduleUz: '8 soatlik smena, rasmiy ishga joylashish',
    scheduleRu: '8-часовая смена, официальное трудоустройство',
    requirementsUz: 'O\'zbek va rus tillarini bilish, kompyuterda tez ishlash.',
    requirementsRu: 'Знание узбекского и русского языков, уверенный пользователь ПК.'
  },
  {
    id: 4,
    titleUz: 'Filial menejeri',
    titleRu: 'Менеджер филиала',
    salaryUz: '8 000 000 - 13 000 000 so\'m',
    salaryRu: '8 000 000 - 13 000 000 сум',
    scheduleUz: 'To\'liq kun, bonus tizimi',
    scheduleRu: 'Полный день, система бонусов',
    requirementsUz: 'Restoran yoki umumiy ovqatlanish sohasida kamida 1 yillik boshqaruv tajribasi.',
    requirementsRu: 'Опыт управления в сфере общепита от 1 года.'
  }
];

exports.getPublicInfo = (_req, res) => {
  res.json({
    success: true,
    data: {
      brand: {
        name: 'MAZZA',
        phone: '+998 71 200 70 70',
        email: 'hello@mazza.uz',
        deliveryTimeMinutes: '25-40',
        deliveryFee: Number(process.env.DELIVERY_FEE || 15000),
        freeDeliveryThreshold: Number(process.env.FREE_DELIVERY_THRESHOLD || 100000)
      },
      branches: BRANCHES,
      vacancies: VACANCIES,
      about: {
        uz: {
          title: 'MAZZA — Yangi avlod tez ovqatlanish tarmog\'i',
          lead: '2019-yildan beri O\'zbekiston bo\'ylab har kuni minglab mehmonlarimizga issiq, yangi va halol taomlarni tezkor yetkazib beramiz.',
          highlights: [
            '100% Halol sertifikatlangan barra go\'sht va tabiiy mahsulotlar',
            'Buyurtma berilgan zahoti pishiriladigan yangi lavash va burgerlar',
            'O\'rtacha 30 daqiqada issiq holda yetkazib berish kafolati',
            'Toshkent, Samarqand va Farg\'ona bo\'ylab zamonaviy filiallar'
          ]
        },
        ru: {
          title: 'MAZZA — Сеть ресторанов быстрого питания нового поколения',
          lead: 'С 2019 года мы ежедневно готовим свежие, горячие и халяльные блюда для тысяч гостей по всему Узбекистану.',
          highlights: [
            '100% Халяль сертифицированное свежее мясо и натуральные ингредиенты',
            'Приготовление лавашей и бургеров строго после оформления заказа',
            'Гарантия горячей доставки в среднем за 30 минут',
            'Современные филиалы в Ташкенте, Самарканде и Фергане'
          ]
        }
      }
    }
  });
};
