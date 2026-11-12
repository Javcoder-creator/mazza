const bcrypt = require('bcrypt');
require('dotenv').config();
const {
  sequelize,
  User,
  Admin,
  Category,
  Product,
  ProductImage,
  Address,
  Promotion,
  Banner,
  Order,
  OrderItem
} = require('../models');
const { saltRounds } = require('../config/auth');

const CATEGORIES_SEED = [
  {
    slug: 'aksiyalar',
    nameUz: 'Aksiyalar',
    nameRu: 'Акции',
    descriptionUz: 'Eng foydali chegirmalar va maxsus takliflar',
    descriptionRu: 'Самые выгодные скидки и спецпредложения',
    icon: 'promo',
    sortOrder: 1,
    isVirtual: true
  },
  {
    slug: 'yangiliklar',
    nameUz: 'Yangiliklar',
    nameRu: 'Новинки',
    descriptionUz: 'Yangi mavsumning eng mazali taomlari',
    descriptionRu: 'Новые хиты нашего меню',
    icon: 'new',
    sortOrder: 2,
    isVirtual: true
  },
  {
    slug: 'lavash',
    nameUz: 'Lavash',
    nameRu: 'Лаваш',
    descriptionUz: 'Issiq tandir va gril lavashlar',
    descriptionRu: 'Сочные горячие лаваши на гриле',
    icon: '/uploads/products/lavash-beef.jpg',
    sortOrder: 3
  },
  {
    slug: 'burger',
    nameUz: 'Burger',
    nameRu: 'Бургеры',
    descriptionUz: 'Yumshoq brioj bulochkada barra kotletli burgerlar',
    descriptionRu: 'Сочные бургеры на мягкой булочке бриошь',
    icon: '/uploads/products/burger-cheese.jpg',
    sortOrder: 4
  },
  {
    slug: 'shaurma',
    nameUz: 'Shaurma',
    nameRu: 'Шаурма',
    descriptionUz: 'Xushbo\'y sousli qarsildoq shaurmalar',
    descriptionRu: 'Хрустящая шаурма с фирменным соусом',
    icon: '/uploads/products/shaurma.jpg',
    sortOrder: 5
  },
  {
    slug: 'hot-dog',
    nameUz: 'Hot-dog',
    nameRu: 'Хот-доги',
    descriptionUz: 'Qirollik va klassik hot-doglar',
    descriptionRu: 'Королевские и классические хот-доги',
    icon: '/uploads/products/hotdog.jpg',
    sortOrder: 6
  },
  {
    slug: 'pizza',
    nameUz: 'Pizza',
    nameRu: 'Пицца',
    descriptionUz: 'Motsarella pishlog\'i bilan issiq pitsalar',
    descriptionRu: 'Горячая пицца с сыром моцарелла',
    icon: '/uploads/products/pizza.jpg',
    sortOrder: 7
  },
  {
    slug: 'donar',
    nameUz: 'Donar',
    nameRu: 'Донар',
    descriptionUz: 'To\'yimli donar lagan va boks taomlari',
    descriptionRu: 'Сытные блюда донар и боксы',
    icon: '/uploads/products/donar.svg',
    sortOrder: 8
  },
  {
    slug: 'kartoshka',
    nameUz: 'Kartoshka',
    nameRu: 'Картошка',
    descriptionUz: 'Qarsildoq fri va qishloqcha kartoshka',
    descriptionRu: 'Хрустящий картофель фри и по-деревенски',
    icon: '/uploads/products/fries.jpg',
    sortOrder: 9
  },
  {
    slug: 'ichimliklar',
    nameUz: 'Ichimliklar',
    nameRu: 'Напитки',
    descriptionUz: 'Muzdek limonad, kola va ichimliklar',
    descriptionRu: 'Прохладительные напитки и лимонады',
    icon: '/uploads/products/drink-cola.jpg',
    sortOrder: 10
  },
  {
    slug: 'desertlar',
    nameUz: 'Desertlar',
    nameRu: 'Десерты',
    descriptionUz: 'Shirin tortlar va shokoladli desertlar',
    descriptionRu: 'Нежные торты и шоколадные десерты',
    icon: '/uploads/products/dessert-cake.jpg',
    sortOrder: 11
  },
  {
    slug: 'setlar',
    nameUz: 'Setlar',
    nameRu: 'Сеты',
    descriptionUz: 'Oilaviy va do\'stlar davrasi uchun kombo setlar',
    descriptionRu: 'Выгодные комбо-сеты для компании и семьи',
    icon: '/uploads/products/combo-set.jpg',
    sortOrder: 12
  }
];

function buildProductsSeed(catMap) {
  return [
    // Lavash
    {
      categoryId: catMap.lavash,
      slug: 'mol-goshtli-lavash-l',
      nameUz: 'Mol go\'shtli Lavash L',
      nameRu: 'Лаваш с говядиной L',
      descriptionUz: 'Grilda qizartirilgan barra mol go\'shti, yangi pomidor va maxsus oq sous bilan tayyorlangan klassik katta lavash.',
      descriptionRu: 'Классический большой лаваш с обжаренной сочной говядиной, свежими томатами и фирменным соусом.',
      ingredientsUz: 'Mol go\'shti, lavash xamiri, pomidor, bodring, qizil piyoz, ko\'katlar, maxsus sarimsoqli sous',
      ingredientsRu: 'Говядина, тонкий лаваш, томаты, свежие огурцы, красный лук, зелень, фирменный чесночный соус',
      price: 38000,
      oldPrice: 44000,
      calories: 560,
      volumeUz: '340 g',
      volumeRu: '340 г',
      badgeUz: 'Xit savdo',
      badgeRu: 'Хит продаж',
      imageUrl: '/uploads/products/lavash-beef.jpg',
      isPromo: true,
      sortOrder: 1
    },
    {
      categoryId: catMap.lavash,
      slug: 'pishloqli-4x-lavash',
      nameUz: '4x Pishloqli Lavash',
      nameRu: 'Сырный 4x Лаваш',
      descriptionUz: 'Eritilgan chedder va motsarella pishloqlari bilan boyitilgan qaynoq mol go\'shtli lavash.',
      descriptionRu: 'Горячий говяжий лаваш с двойной порцией расплавленного сыра чеддер и моцарелла.',
      ingredientsUz: 'Mol go\'shti, chedder pishlog\'i, motsarella, chips, pomidor, pishloqli sous',
      ingredientsRu: 'Говядина, сыр чеддер, моцарелла, чипсы, томаты, сырный соус',
      price: 44000,
      calories: 640,
      volumeUz: '370 g',
      volumeRu: '370 г',
      badgeUz: '4x pishloq',
      badgeRu: '4x сыра',
      imageUrl: '/uploads/products/lavash-beef.jpg',
      isNew: true,
      sortOrder: 2
    },
    {
      categoryId: catMap.lavash,
      slug: 'tovuq-goshtli-qalampirli-lavash',
      nameUz: 'Achchiq Tovuqli Lavash',
      nameRu: 'Острый Куриный Лаваш',
      descriptionUz: 'Xushbo\'y ziravorlarda marinadlangan tovuq filesi va yengil achchiq xalapenyo ta\'mi.',
      descriptionRu: 'Маринованное куриное филе на гриле с пикантным перцем халапеньо и томатным соусом.',
      ingredientsUz: 'Tovuq filesi, xalapenyo qalampiri, pomidor, aysberg salati, achchiq sous',
      ingredientsRu: 'Куриное филе, перец халапеньо, томаты, салат айсберг, острый соус',
      price: 35000,
      calories: 495,
      volumeUz: '320 g',
      volumeRu: '320 г',
      badgeUz: 'Achchiq',
      badgeRu: 'Острый',
      imageUrl: '/uploads/products/shaurma.jpg',
      sortOrder: 3
    },
    // Burger
    {
      categoryId: catMap.burger,
      slug: 'double-cheeseburger-mazza',
      nameUz: 'Double Cheeseburger',
      nameRu: 'Дабл Чизбургер',
      descriptionUz: 'Ikki qavatli barra mol go\'shti kotleti, eritilgan chedder pishlog\'i va brioj bulochka.',
      descriptionRu: 'Двойная котлета из мраморной говядины, двойной сыр чеддер и фирменная булочка бриошь.',
      ingredientsUz: '2x mol go\'shti kotleti, 2x chedder, brioj bulochka, marinadlangan bodring, pomidor, aysberg, burger sousi',
      ingredientsRu: '2x говяжья котлета, 2x сыр чеддер, булочка бриошь, маринованные огурцы, томат, айсберг, фирменный соус',
      price: 45000,
      oldPrice: 52000,
      calories: 690,
      volumeUz: '310 g',
      volumeRu: '310 г',
      badgeUz: '-13% Aksiya',
      badgeRu: '-13% Акция',
      imageUrl: '/uploads/products/burger-cheese.jpg',
      isPromo: true,
      sortOrder: 4
    },
    {
      categoryId: catMap.burger,
      slug: 'classic-gamburger',
      nameUz: 'Klassik Gamburger',
      nameRu: 'Классический Гамбургер',
      descriptionUz: 'Har bir tishlami mazali: shirali kotlet, yangi sabzavotlar va yumshoq kunjutli bulochka.',
      descriptionRu: 'Идеальный классический баланс сочной говяжьей котлеты, хрустящих овощей и мягкой булочки.',
      ingredientsUz: 'Mol go\'shti kotleti, pomidor, tuzlangan bodring, salat bargi, ketchup va xantal sousi',
      ingredientsRu: 'Говяжья котлета, томат, соленые огурцы, листья салата, кетчуп и горчичный соус',
      price: 34000,
      calories: 510,
      volumeUz: '240 g',
      volumeRu: '240 г',
      imageUrl: '/uploads/products/burger-cheese.jpg',
      sortOrder: 5
    },
    {
      categoryId: catMap.burger,
      slug: 'mini-kids-cheeseburger',
      nameUz: 'Mini Chizburger (Bolalarga)',
      nameRu: 'Мини Чизбургер (Детский)',
      descriptionUz: 'Bolajonlar uchun maxsus yumshoq va foydali mini chizburger.',
      descriptionRu: 'Нежный и вкусный мини-чизбургер, созданный специально для детей.',
      ingredientsUz: 'Yumshoq mol go\'shti kotleti, chedder pishlog\'i, shirin pomidor, bulochka',
      ingredientsRu: 'Нежная говяжья котлета, сыр чеддер, сладкий томат, мягкая булочка',
      price: 24000,
      calories: 320,
      volumeUz: '160 g',
      volumeRu: '160 г',
      badgeUz: 'Bolalarga',
      badgeRu: 'Детям',
      imageUrl: '/uploads/products/burger-cheese.jpg',
      isKids: true,
      sortOrder: 6
    },
    // Shaurma
    {
      categoryId: catMap.shaurma,
      slug: 'tovuqli-qarsildoq-shaurma',
      nameUz: 'Tovuqli Shaurma',
      nameRu: 'Куриная Шаурма',
      descriptionUz: 'Qarsildoq gril non ichida shirali tovuq go\'shti, bodring va mayin sarimsoqli sous.',
      descriptionRu: 'Сочная курица гриль в хрустящей поджаренной лепешке с пикантными огурчиками и чесночным соусом.',
      ingredientsUz: 'Tovuq go\'shti, qarsildoq non, tuzlangan bodring, pomidor, sarimsoqli oq sous',
      ingredientsRu: 'Куриное мясо, хрустящая лепешка, маринованные огурцы, томаты, белый чесночный соус',
      price: 33000,
      calories: 480,
      volumeUz: '310 g',
      volumeRu: '310 г',
      badgeUz: 'Yangi',
      badgeRu: 'Новинка',
      imageUrl: '/uploads/products/shaurma.jpg',
      isNew: true,
      sortOrder: 7
    },
    {
      categoryId: catMap.shaurma,
      slug: 'mol-goshtli-shaurma-xl',
      nameUz: 'Mol go\'shtli Shaurma XL',
      nameRu: 'Шаурма с говядиной XL',
      descriptionUz: 'Katta ishtaha egalari uchun qo\'shimcha go\'sht va kartoshka fri bilan tayyorlangan shaurma.',
      descriptionRu: 'Увеличенная порция шаурмы с говядиной и хрустящим картофелем внутри.',
      ingredientsUz: 'Mol go\'shti, kartoshka fri, pomidor, tuzlangan bodring, maxsus gril sousi',
      ingredientsRu: 'Говядина, картофель фри, томаты, маринованные огурцы, соус гриль',
      price: 41000,
      calories: 610,
      volumeUz: '380 g',
      volumeRu: '380 г',
      imageUrl: '/uploads/products/shaurma.jpg',
      sortOrder: 8
    },
    // Hot-dog
    {
      categoryId: catMap['hot-dog'],
      slug: 'qirollik-hot-dog',
      nameUz: 'Qirollik Hot-dog',
      nameRu: 'Королевский Хот-дог',
      descriptionUz: 'Dudlangan mol go\'shti sosiskasi, qovurilgan piyoz va ikki xil sousli uzun hot-dog.',
      descriptionRu: 'Длинный королевский хот-дог с подкопченной говяжьей сосиской, хрустящим луком и двумя соусами.',
      ingredientsUz: 'Dudlangan mol sosiskasi, brioj bulochka, qovurilgan piyoz, pishloq, xantal, ketchup',
      ingredientsRu: 'Копченая говяжья сосиска, булочка бриошь, жареный лук, сыр, горчица, кетчуп',
      price: 29000,
      oldPrice: 34000,
      calories: 430,
      volumeUz: '230 g',
      volumeRu: '230 г',
      badgeUz: 'Aksiya',
      badgeRu: 'Акция',
      imageUrl: '/uploads/products/hotdog.jpg',
      isPromo: true,
      sortOrder: 9
    },
    {
      categoryId: catMap['hot-dog'],
      slug: 'klassik-hot-dog',
      nameUz: 'Klassik Hot-dog',
      nameRu: 'Классический Хот-дог',
      descriptionUz: 'Tez va mazali tamaddi uchun issiq bulochkadagi klassik hot-dog.',
      descriptionRu: 'Классический горячий хот-дог в воздушной булочке для быстрого перекуса.',
      ingredientsUz: 'Halol sosiska, yumshoq bulochka, tuzlangan bodring, ketchup, xantal',
      ingredientsRu: 'Халяль сосиска, мягкая булочка, маринованный огурец, кетчуп, горчица',
      price: 21000,
      calories: 340,
      volumeUz: '180 g',
      volumeRu: '180 г',
      imageUrl: '/uploads/products/hotdog.jpg',
      sortOrder: 10
    },
    // Pizza
    {
      categoryId: catMap.pizza,
      slug: 'pepperoni-pizza-32cm',
      nameUz: 'Pepperoni Pizza 32 sm',
      nameRu: 'Пицца Пепперони 32 см',
      descriptionUz: 'Haqiqiy italyan motsarella pishlog\'i, halol pepperoni kolbasasi va xushbo\'y rayhon bilan pishirilgan pitsa.',
      descriptionRu: 'Пицца на тонком тесте с тянущейся моцареллой, халяль пепперони и свежим базиликом.',
      ingredientsUz: 'Pitsa xamiri, italyan tomat sousi, motsarella pishlog\'i, halol pepperoni, rayhon',
      ingredientsRu: 'Фирменное тесто, итальянский томатный соус, сыр моцарелла, халяль пепперони, базилик',
      price: 78000,
      oldPrice: 89000,
      calories: 1180,
      volumeUz: '32 sm (640 g)',
      volumeRu: '32 см (640 г)',
      badgeUz: 'Yangi',
      badgeRu: 'Новинка',
      imageUrl: '/uploads/products/pizza.jpg',
      isNew: true,
      isPromo: true,
      sortOrder: 11
    },
    {
      categoryId: catMap.pizza,
      slug: 'tovuq-va-qoziqorinli-pizza',
      nameUz: 'Mazza Assorti Pizza 32 sm',
      nameRu: 'Пицца Мазза Ассорти 32 см',
      descriptionUz: 'Mol go\'shti, dudlangan tovuq, qo\'ziqorin va qo\'shimcha motsarella bilan to\'yimli pitsa.',
      descriptionRu: 'Сытная пицца с говядиной, копченой курицей, шампиньонами и двойной моцареллой.',
      ingredientsUz: 'Mol go\'shti, tovuq filesi, qo\'ziqorin, zaytun, motsarella, pomidor sousi',
      ingredientsRu: 'Говядина, куриное филе, шампиньоны, оливки, моцарелла, томатный соус',
      price: 84000,
      calories: 1240,
      volumeUz: '32 sm (680 g)',
      volumeRu: '32 см (680 г)',
      imageUrl: '/uploads/products/pizza.jpg',
      sortOrder: 12
    },
    // Donar
    {
      categoryId: catMap.donar,
      slug: 'mol-goshtli-donar-boks',
      nameUz: 'Mol go\'shtli Donar Box',
      nameRu: 'Донар Бокс с говядиной',
      descriptionUz: 'Yirik to\'g\'ralgan qovurma mol go\'shti, qarsildoq kartoshka fri, yangi salat va sarimsoqli sous to\'plami.',
      descriptionRu: 'Ароматная жареная говядина, хрустящий картофель фри, свежий салат и чесночный соус в удобном боксе.',
      ingredientsUz: 'Qovurma mol go\'shti, kartoshka fri, karam-pomidor salati, sarimsoqli sous, non bo\'laklari',
      ingredientsRu: 'Жареная говядина, картофель фри, свежий салат, чесночный соус, ломтики лепешки',
      price: 49000,
      calories: 720,
      volumeUz: '420 g',
      volumeRu: '420 г',
      badgeUz: 'To\'yimli',
      badgeRu: 'Сытно',
      imageUrl: '/uploads/products/donar.svg',
      isNew: true,
      sortOrder: 13
    },
    {
      categoryId: catMap.donar,
      slug: 'tovuqli-donar-lagan',
      nameUz: 'Tovuqli Donar Taomi',
      nameRu: 'Донар Тарелка с курицей',
      descriptionUz: 'Grilda pishgan tovuq go\'shti, fri va ikki xil sous bilan beriladigan to\'liq tushlik.',
      descriptionRu: 'Полноценный обед из нежной курицы гриль, картофеля фри, свежего салата и двух соусов.',
      ingredientsUz: 'Tovuq go\'shti, kartoshka fri, pomidor, bodring, guruch yoki non, oq sous',
      ingredientsRu: 'Куриное филе гриль, картофель фри, томаты, огурцы, лепешка, белый соус',
      price: 44000,
      calories: 650,
      volumeUz: '400 g',
      volumeRu: '400 г',
      imageUrl: '/uploads/products/donar.svg',
      sortOrder: 14
    },
    // Kartoshka
    {
      categoryId: catMap.kartoshka,
      slug: 'kartoshka-fri-l',
      nameUz: 'Kartoshka Fri L',
      nameRu: 'Картофель Фри L',
      descriptionUz: 'Tashqarisi qarsildoq, ichi yumshoq va dengiz tuzi sepilgan issiq oltinrang kartoshka fri.',
      descriptionRu: 'Золотистый хрустящий снаружи и нежный внутри картофель фри с морской солью.',
      ingredientsUz: 'Tanlab olingan kartoshka, o\'simlik yog\'i, dengiz tuzi',
      ingredientsRu: 'Отборный картофель, растительное масло, морская соль',
      price: 19000,
      calories: 380,
      volumeUz: '160 g',
      volumeRu: '160 г',
      imageUrl: '/uploads/products/fries.jpg',
      sortOrder: 15
    },
    {
      categoryId: catMap.kartoshka,
      slug: 'kartoshka-fri-mini-kids',
      nameUz: 'Kartoshka Fri S',
      nameRu: 'Картофель Фри S',
      descriptionUz: 'Kichik porsiyadagi issiq va qarsildoq kartoshka fri — bolalar va yengil tamaddi uchun a\'lo tanlov.',
      descriptionRu: 'Небольшая порция горячего хрустящего картофеля фри — отлично подойдет детям.',
      ingredientsUz: 'Tanlab olingan kartoshka, o\'simlik yog\'i, yengil tuz',
      ingredientsRu: 'Отборный картофель, растительное масло, щепотка соли',
      price: 13000,
      calories: 240,
      volumeUz: '100 g',
      volumeRu: '100 г',
      imageUrl: '/uploads/products/fries.jpg',
      isKids: true,
      sortOrder: 16
    },
    // Ichimliklar
    {
      categoryId: catMap.ichimliklar,
      slug: 'muzdek-cola-05',
      nameUz: 'Muzdek Cola 0.5 L',
      nameRu: 'Освежающая Кола 0.5 л',
      descriptionUz: 'Muz bo\'laklari bilan to\'ldirilgan salqin gazli ichimlik.',
      descriptionRu: 'Прохладный газированный напиток со льдом в удобном стакане.',
      ingredientsUz: 'Gazlangan ichimlik, muz bo\'laklari',
      ingredientsRu: 'Газированный напиток, кубики льда',
      price: 12000,
      calories: 210,
      volumeUz: '500 ml',
      volumeRu: '500 мл',
      imageUrl: '/uploads/products/drink-cola.jpg',
      sortOrder: 17
    },
    {
      categoryId: catMap.ichimliklar,
      slug: 'yalpiz-limonli-moxito',
      nameUz: 'Yalpizli Limonad Moxito',
      nameRu: 'Мятный Лимонад Мохито',
      descriptionUz: 'Yangi yalpiz barglari, laym sharbati va muz bilan tayyorlangan tetiklashtiruvchi limonad.',
      descriptionRu: 'Освежающий авторский лимонад со свежей мятой, соком лайма и льдом.',
      ingredientsUz: 'Yangi yalpiz, limon va laym sharbati, gazlangan suv, shakar siropi, muz',
      ingredientsRu: 'Свежая мята, сок лимона и лайма, газированная вода, сахарный сироп, лед',
      price: 18000,
      calories: 145,
      volumeUz: '450 ml',
      volumeRu: '450 мл',
      badgeUz: 'Yangi',
      badgeRu: 'Новинка',
      imageUrl: '/uploads/products/drink-lemonade.jpg',
      isNew: true,
      sortOrder: 18
    },
    // Desertlar
    {
      categoryId: catMap.desertlar,
      slug: 'shokoladli-fadj-tort',
      nameUz: 'Shokoladli Fudge Torti',
      nameRu: 'Шоколадный торт Фадж',
      descriptionUz: 'Belgicha quyuq shokolad kremi va yangi malina bilan bezatilgan yumshoq biskvit tort bo\'lagi.',
      descriptionRu: 'Нежный шоколадный бисквит с кремом из бельгийского шоколада и свежей малиной.',
      ingredientsUz: 'Qora shokolad, kakao, sariyog\', qaymoq, tuxum, un, malina',
      ingredientsRu: 'Темный шоколад, какао, сливочное масло, сливки, яйца, мука, малина',
      price: 26000,
      calories: 410,
      volumeUz: '145 g',
      volumeRu: '145 г',
      badgeUz: 'Shirinlik',
      badgeRu: 'Сладкое',
      imageUrl: '/uploads/products/dessert-cake.jpg',
      sortOrder: 19
    },
    {
      categoryId: catMap.desertlar,
      slug: 'bolalar-shokoladli-muffin',
      nameUz: 'Shirin Mini Tort (Bolalarga)',
      nameRu: 'Сладкий Мини-торт (Детский)',
      descriptionUz: 'Sutli shokolad va qaymoqli kremdan tayyorlangan bolalar sevib iste\'mol qiladigan desert.',
      descriptionRu: 'Нежный детский десерт с молочным шоколадом и воздушным сливочным кремом.',
      ingredientsUz: 'Sutli shokolad, vanil biskviti, qaymoqli krem',
      ingredientsRu: 'Молочный шоколад, ванильный бисквит, сливочный крем',
      price: 20000,
      calories: 290,
      volumeUz: '110 g',
      volumeRu: '110 г',
      imageUrl: '/uploads/products/dessert-cake.jpg',
      isKids: true,
      sortOrder: 20
    },
    // Setlar
    {
      categoryId: catMap.setlar,
      slug: 'mazza-lavash-kombo',
      nameUz: 'MAZZA Lavash Kombo',
      nameRu: 'MAZZA Лаваш Комбо',
      descriptionUz: 'Mol go\'shtli lavash L, katta kartoshka fri va muzdek Cola 0.5 L — hammasi bitta foydali to\'plamda!',
      descriptionRu: 'Большой лаваш с говядиной, картофель фри L и холодная кола 0.5 л в одном выгодном комбо!',
      ingredientsUz: 'Mol go\'shtli Lavash L, Kartoshka Fri L, Muzdek Cola 0.5 L, ketchup',
      ingredientsRu: 'Лаваш с говядиной L, Картофель Фри L, Кола 0.5 л, кетчуп',
      price: 59000,
      oldPrice: 69000,
      calories: 1150,
      volumeUz: '3 ta mahsulot',
      volumeRu: '3 позиции',
      badgeUz: '-15% Set',
      badgeRu: '-15% Сет',
      imageUrl: '/uploads/products/combo-set.jpg',
      isPromo: true,
      sortOrder: 21
    },
    {
      categoryId: catMap.setlar,
      slug: 'bolalar-quvonch-boks',
      nameUz: 'Bolajon Quvonch Seti + O\'yinchoq',
      nameRu: 'Детский Набор Радость + Игрушка',
      descriptionUz: 'Mini Chizburger, Kartoshka Fri S, tabiiy meva sharbati va har bir qutida syurpriz o\'yinchoq!',
      descriptionRu: 'Мини чизбургер, картофель фри S, натуральный фруктовый сок и игрушка-сюрприз в каждой коробке!',
      ingredientsUz: 'Mini chizburger, kartoshka fri S, 200 ml sharbat, kolleksion o\'yinchoq',
      ingredientsRu: 'Мини-чизбургер, картофель фри S, сок 200 мл, коллекционная игрушка',
      price: 42000,
      oldPrice: 48000,
      calories: 590,
      volumeUz: 'Set + O\'yinchoq',
      volumeRu: 'Сет + Игрушка',
      badgeUz: 'Bolalarga',
      badgeRu: 'Детям',
      imageUrl: '/uploads/products/kids-box.svg',
      isKids: true,
      isPromo: true,
      isNew: true,
      sortOrder: 22
    },
    {
      categoryId: catMap.setlar,
      slug: 'oilaviy-mega-set',
      nameUz: 'Oilaviy Mega Set (4 kishilik)',
      nameRu: 'Семейный Мега Сет (на 4 персоны)',
      descriptionUz: '2 ta Mol go\'shtli Lavash, 2 ta Double Cheeseburger, 2 ta Katta Fri va 4 ta ichimlik — katta davra uchun.',
      descriptionRu: '2 говяжьих лаваша, 2 дабл чизбургера, 2 больших фри и 4 напитка — идеальный набор для семьи и друзей.',
      ingredientsUz: '2x Lavash L, 2x Double Cheeseburger, 2x Fri L, 4x Cola 0.5 L, 4x sous',
      ingredientsRu: '2x Лаваш L, 2x Дабл Чизбургер, 2x Фри L, 4x Кола 0.5 л, 4x соус',
      price: 165000,
      oldPrice: 198000,
      calories: 3200,
      volumeUz: '10+ mahsulot',
      volumeRu: '10+ позиций',
      badgeUz: 'Eng foydali',
      badgeRu: 'Выгода 33 000',
      imageUrl: '/uploads/products/combo-set.jpg',
      isPromo: true,
      sortOrder: 23
    }
  ];
}

async function seedDatabase({ force = false } = {}) {
  const existingCategories = await Category.count();
  if (existingCategories > 0 && !force) {
    return;
  }

  console.log('MAZZA ma\'lumotlar bazasini boshlang\'ich ma\'lumotlar bilan to\'ldirish boshlandi...');

  // 1. Admin account
  const adminPasswordHash = await bcrypt.hash('Admin123!', saltRounds);
  await Admin.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      fullName: 'Asosiy Administrator',
      username: 'admin',
      email: 'admin@mazza.uz',
      passwordHash: adminPasswordHash,
      role: 'super_admin',
      isActive: true
    }
  });

  // 2. Demo user + addresses
  const userPasswordHash = await bcrypt.hash('User123!', saltRounds);
  const [demoUser] = await User.findOrCreate({
    where: { phone: '+998901234567' },
    defaults: {
      fullName: 'Azizbek Karimov',
      phone: '+998901234567',
      email: 'azizbek@mazza.uz',
      passwordHash: userPasswordHash,
      preferredLanguage: 'uz',
      isActive: true
    }
  });

  const addrCount = await Address.count({ where: { userId: demoUser.id } });
  if (addrCount === 0) {
    await Address.bulkCreate([
      {
        userId: demoUser.id,
        label: 'Uy',
        streetAddress: 'Toshkent sh., Chilonzor tumani, 9-kvartal, 14-uy',
        apartment: '28',
        entrance: '2',
        floor: '4',
        landmark: 'Metro Chilonzor yonida',
        isDefault: true
      },
      {
        userId: demoUser.id,
        label: 'Ishxona',
        streetAddress: 'Toshkent sh., Amir Temur shoh ko\'chasi, 107B',
        apartment: '504-ofis',
        entrance: '1',
        floor: '5',
        landmark: 'IT Park biznes markazi',
        isDefault: false
      }
    ]);
  }

  // 3. Categories
  const categoryMap = {};
  for (const catData of CATEGORIES_SEED) {
    const [cat] = await Category.findOrCreate({
      where: { slug: catData.slug },
      defaults: catData
    });
    categoryMap[cat.slug] = cat.id;
  }

  // 4. Products & Product Images
  const productsSeed = buildProductsSeed(categoryMap);
  const productMap = {};
  for (const prodData of productsSeed) {
    const [prod] = await Product.findOrCreate({
      where: { slug: prodData.slug },
      defaults: prodData
    });
    productMap[prod.slug] = prod;

    const imgCount = await ProductImage.count({ where: { productId: prod.id } });
    if (imgCount === 0) {
      await ProductImage.create({
        productId: prod.id,
        imageUrl: prod.imageUrl,
        isPrimary: true,
        sortOrder: 0
      });
    }
  }

  // 5. Promotions
  const [promo1] = await Promotion.findOrCreate({
    where: { promoCode: 'MAZZA15' },
    defaults: {
      titleUz: 'Birinchi buyurtmaga 15% chegirma!',
      titleRu: 'Скидка 15% на первый заказ!',
      descriptionUz: 'Savatda MAZZA15 promo kodini kiriting va istalgan taomlarga 15% chegirma oling.',
      descriptionRu: 'Введите промокод MAZZA15 в корзине и получите скидку 15% на весь заказ.',
      promoCode: 'MAZZA15',
      discountPercent: 15,
      discountAmount: 0,
      minOrderAmount: 40000,
      badgeText: '-15%',
      imageUrl: '/uploads/banners/banner-lavash.jpg',
      categoryId: categoryMap.lavash,
      productId: productMap['mazza-lavash-kombo']?.id || null,
      isActive: true
    }
  });

  const [promo2] = await Promotion.findOrCreate({
    where: { promoCode: 'BURGER20' },
    defaults: {
      titleUz: 'Double Cheeseburger haftaligi — 20 000 so\'m chegirma',
      titleRu: 'Неделя Дабл Чизбургера — скидка 20 000 сум',
      descriptionUz: '80 000 so\'mdan yuqori buyurtmalarda BURGER20 kodi bilan 20 000 so\'m tejang.',
      descriptionRu: 'При заказе от 80 000 сум используйте код BURGER20 и экономьте 20 000 сум.',
      promoCode: 'BURGER20',
      discountPercent: 0,
      discountAmount: 20000,
      minOrderAmount: 80000,
      badgeText: '-20 000',
      imageUrl: '/uploads/banners/banner-burger.jpg',
      categoryId: categoryMap.burger,
      productId: productMap['double-cheeseburger-mazza']?.id || null,
      isActive: true
    }
  });

  const [promo3] = await Promotion.findOrCreate({
    where: { promoCode: 'SET10' },
    defaults: {
      titleUz: 'Oilaviy Setlarga qo\'shimcha 10% chegirma',
      titleRu: 'Дополнительная скидка 10% на Семейные Сеты',
      descriptionUz: 'Do\'stlar va oila davrasida mazali setlarga SET10 kodi orqali buyurtma bering.',
      descriptionRu: 'Заказывайте большие сеты для компании и семьи со скидкой по коду SET10.',
      promoCode: 'SET10',
      discountPercent: 10,
      discountAmount: 0,
      minOrderAmount: 50000,
      badgeText: '-10%',
      imageUrl: '/uploads/banners/banner-combo.jpg',
      categoryId: categoryMap.setlar,
      productId: productMap['oilaviy-mega-set']?.id || null,
      isActive: true
    }
  });

  // 6. Banners
  const bannersCount = await Banner.count();
  if (bannersCount === 0) {
    await Banner.bulkCreate([
      {
        titleUz: 'Issiq Gril Lavash Kombo — 15% Chegirma!',
        titleRu: 'Горячий Гриль Лаваш Комбо — Скидка 15%!',
        subtitleUz: 'MAZZA15 promo kodi bilan 30 daqiqada eshigingizgacha issiq yetkazib beramiz.',
        subtitleRu: 'Доставим горячим за 30 минут. Используйте промокод MAZZA15.',
        ctaTextUz: 'Buyurtma berish',
        ctaTextRu: 'Заказать сейчас',
        imageUrl: '/uploads/banners/banner-lavash.jpg',
        linkType: 'product',
        productId: productMap['mazza-lavash-kombo']?.id || null,
        promotionId: promo1.id,
        categoryId: categoryMap.lavash,
        sortOrder: 1,
        isActive: true
      },
      {
        titleUz: 'Double Cheeseburger — Haqiqiy Cheddar Ta\'mi',
        titleRu: 'Дабл Чизбургер — Вкус Настоящего Чеддера',
        subtitleUz: 'Ikki qavatli barra mol go\'shti va yumshoq brioj bulochkasi endi maxsus narxda!',
        subtitleRu: 'Две сочные котлеты из говядины на мягкой булочке бриошь по специальной цене!',
        ctaTextUz: 'Burgerni ko\'rish',
        ctaTextRu: 'Смотреть бургер',
        imageUrl: '/uploads/banners/banner-burger.jpg',
        linkType: 'product',
        productId: productMap['double-cheeseburger-mazza']?.id || null,
        promotionId: promo2.id,
        categoryId: categoryMap.burger,
        sortOrder: 2,
        isActive: true
      },
      {
        titleUz: 'Katta Davralar Uchun Oilaviy Kombo Setlar',
        titleRu: 'Выгодные Семейные Комбо Сеты Для Компании',
        subtitleUz: '100 000 so\'mdan yuqori buyurtmalarga yetkazib berish mutlaqo BEPUL!',
        subtitleRu: 'При заказе от 100 000 сум доставка абсолютно БЕСПЛАТНА!',
        ctaTextUz: 'Setlarni ko\'rish',
        ctaTextRu: 'Выбрать сет',
        imageUrl: '/uploads/banners/banner-combo.jpg',
        linkType: 'category',
        categoryId: categoryMap.setlar,
        promotionId: promo3.id,
        sortOrder: 3,
        isActive: true
      }
    ]);
  }

  // 7. Sample Order for Demo User & Admin visibility
  const orderCount = await Order.count();
  if (orderCount === 0) {
    const lavashProd = productMap['mol-goshtli-lavash-l'];
    const friesProd = productMap['kartoshka-fri-l'];
    const colaProd = productMap['muzdek-cola-05'];

    if (lavashProd && friesProd && colaProd) {
      const subtotal = lavashProd.price * 2 + friesProd.price + colaProd.price * 2;
      const sampleOrder = await Order.create({
        orderNumber: 'MZZ-261111-1001',
        userId: demoUser.id,
        customerName: demoUser.fullName,
        customerPhone: demoUser.phone,
        deliveryAddress: 'Toshkent sh., Chilonzor tumani, 9-kvartal, 14-uy, kv. 28',
        orderType: 'delivery',
        paymentType: 'payme',
        status: 'preparing',
        subtotalAmount: subtotal,
        deliveryFee: 0,
        discountAmount: 0,
        totalAmount: subtotal,
        comment: 'Iltimos, qo\'shimcha salfetka solib yuboring'
      });

      await OrderItem.bulkCreate([
        {
          orderId: sampleOrder.id,
          productId: lavashProd.id,
          productNameUz: lavashProd.nameUz,
          productNameRu: lavashProd.nameRu,
          productImage: lavashProd.imageUrl,
          unitPrice: lavashProd.price,
          quantity: 2,
          totalPrice: lavashProd.price * 2
        },
        {
          orderId: sampleOrder.id,
          productId: friesProd.id,
          productNameUz: friesProd.nameUz,
          productNameRu: friesProd.nameRu,
          productImage: friesProd.imageUrl,
          unitPrice: friesProd.price,
          quantity: 1,
          totalPrice: friesProd.price
        },
        {
          orderId: sampleOrder.id,
          productId: colaProd.id,
          productNameUz: colaProd.nameUz,
          productNameRu: colaProd.nameRu,
          productImage: colaProd.imageUrl,
          unitPrice: colaProd.price,
          quantity: 2,
          totalPrice: colaProd.price * 2
        }
      ]);
    }
  }

  console.log('MAZZA boshlang\'ich ma\'lumotlari muvaffaqiyatli yuklandi.');
}

if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      await seedDatabase({ force: true });
      process.exit(0);
    } catch (err) {
      console.error('Seed xatoligi:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedDatabaseIfEmpty: () => seedDatabase({ force: false }),
  seedDatabase
};
