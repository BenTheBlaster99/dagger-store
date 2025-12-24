export const ALGERIA_WILAYAS = [
    { id: 1, name: 'Adrar' },
    { id: 2, name: 'Chlef' },
    { id: 3, name: 'Laghouat' },
    { id: 4, name: 'Oum El Bouaghi' },
    { id: 5, name: 'Batna' },
    { id: 6, name: 'Béjaïa' },
    { id: 7, name: 'Biskra' },
    { id: 8, name: 'Béchar' },
    { id: 9, name: 'Blida' },
    { id: 10, name: 'Bouira' },
    { id: 11, name: 'Tamanrasset' },
    { id: 12, name: 'Tébessa' },
    { id: 13, name: 'Tlemcen' },
    { id: 14, name: 'Tiaret' },
    { id: 15, name: 'Tizi Ouzou' },
    { id: 16, name: 'Algiers' },
    { id: 17, name: 'Djelfa' },
    { id: 18, name: 'Jijel' },
    { id: 19, name: 'Sétif' },
    { id: 20, name: 'Saïda' },
    { id: 21, name: 'Skikda' },
    { id: 22, name: 'Sidi Bel Abbès' },
    { id: 23, name: 'Annaba' },
    { id: 24, name: 'Guelma' },
    { id: 25, name: 'Constantine' },
    { id: 26, name: 'Médéa' },
    { id: 27, name: 'Mostaganem' },
    { id: 28, name: 'M\'Sila' },
    { id: 29, name: 'Mascara' },
    { id: 30, name: 'Ouargla' },
    { id: 31, name: 'Oran' },
    { id: 32, name: 'El Bayadh' },
    { id: 33, name: 'Illizi' },
    { id: 34, name: 'Bordj Bou Arréridj' },
    { id: 35, name: 'Boumerdès' },
    { id: 36, name: 'El Tarf' },
    { id: 37, name: 'Tindouf' },
    { id: 38, name: 'Tissemsilt' },
    { id: 39, name: 'El Oued' },
    { id: 40, name: 'Khenchela' },
    { id: 41, name: 'Souk Ahras' },
    { id: 42, name: 'Tipaza' },
    { id: 43, name: 'Mila' },
    { id: 44, name: 'Aïn Defla' },
    { id: 45, name: 'Naâma' },
    { id: 46, name: 'Aïn Témouchent' },
    { id: 47, name: 'Ghardaïa' },
    { id: 48, name: 'Relizane' },
    { id: 49, name: 'Timimoun' },
    { id: 50, name: 'Bordj Badji Mokhtar' },
    { id: 51, name: 'Ouled Djellal' },
    { id: 52, name: 'Béni Abbès' },
    { id: 53, name: 'In Salah' },
    { id: 54, name: 'In Guezzam' },
    { id: 55, name: 'Touggourt' },
    { id: 56, name: 'Djanet' },
    { id: 57, name: 'El M\'Ghair' },
    { id: 58, name: 'El Menia' },
    { id: 59, name: 'Ouargla' },
    { id: 60, name: 'Hassi Messaoud' },
    { id: 61, name: 'Bordj Baji Mokhtar' },
    { id: 62, name: 'Béni Ounif' },
    { id: 63, name: 'Timokten' },
    { id: 64, name: 'Touat' },
    { id: 65, name: 'Djanet' },
    { id: 66, name: 'In Amenas' },
    { id: 67, name: 'In Guezzam' },
    { id: 68, name: 'Tamanrasset' },
    { id: 69, name: 'Adrar' }
];

// Communes mapping for each wilaya (keyed by wilaya name)
export const WILAYA_COMMUNES: Record<string, string[]> = {
  'Algiers': [
    'Bab El Oued', 'Bologhine', 'Casbah', 'Oued Koriche', 'Raïs Hamidou',
    'Bab Ezzouar', 'Bordj El Kiffan', 'Dar El Beïda', 'Mohammadia', 'Rouïba',
    'Aïn Taya', 'Bordj El Bahri', 'El Harrach', 'Hussein Dey', 'Kouba',
    'Bachdjerrah', 'Bourouba', 'El Magharia', 'Hydra', 'Les Eucalyptus',
    'Baraki', 'Bouzareah', 'Birkhadem', 'Djasr Kasentina', 'Draria',
    'Bir Mourad Raïs', 'Birtouta', 'Cheraga', 'Dély Ibrahim', 'Douéra',
    'Béni Messous', 'Bouzaréah', 'Chéraga', 'Djasr Kasentina', 'Draria',
    'El Achour', 'Hammamet', 'Mahelma', 'Ouled Fayet', 'Rahmania',
    'Saoula', 'Souidania', 'Staoueli', 'Tessala El Merdja', 'Zéralda'
  ],
  'Oran': [
    'Oran', 'Bir El Djir', 'Es Senia', 'Arzew', 'Bethioua',
    'Aïn El Turk', 'Bousfer', 'Canastel', 'El Ancar', 'El Kerma',
    'Gdyel', 'Hassi Ben Okba', 'Hassi Bounif', 'Hassi Mameche', 'Mers El Kébir',
    'Misserghin', 'Oued Tlelat', 'Sidi Chami', 'Tafraoui', 'Tlemcen'
  ],
  'Constantine': [
    'Constantine', 'Aïn Abid', 'Aïn Smara', 'Beni Hamiden', 'Didouche Mourad',
    'El Khroub', 'Hamma Bouziane', 'Ibn Ziad', 'Messaoud Boudjeriou', 'Ouled Rahmoune',
    'Zighoud Youcef', 'Aïn El Bey', 'Ben Badis', 'El Haria', 'Ibn Badis'
  ],
  'Blida': [
    'Blida', 'Boufarik', 'Bouïnan', 'Bouarfa', 'Chiffa',
    'Chréa', 'El Affroun', 'Hammam Melouane', 'Larbaa', 'Médéa',
    'Mouzaïa', 'Oued Alleug', 'Ouled Yaïch', 'Soumaâ', 'Beni Mered'
  ],
  'Sétif': [
    'Sétif', 'Aïn Arnat', 'Aïn Azel', 'Aïn El Kébira', 'Aïn Oulmene',
    'Amoucha', 'Babor', 'Béni Aziz', 'Béni Ourtilane', 'Bir El Arch',
    'Bouandas', 'Bougaâ', 'Dehamcha', 'Djemila', 'El Eulma',
    'Guelta Zerka', 'Hammam Guergour', 'Hammam Soukhna', 'Maoklane', 'Mezloug',
    'Ouled Tebben', 'Salah Bey', 'Tachouda', 'Talaifacene', 'Taya'
  ],
  'Annaba': [
    'Annaba', 'El Bouni', 'El Hadjar', 'Seraïdi', 'Aïn Berda',
    'Berrahal', 'Chetaïbi', 'Cheurfa', 'Eulma', 'Sidi Amar'
  ],
  'Tizi Ouzou': [
    'Tizi Ouzou', 'Aïn El Hammam', 'Azazga', 'Béni Douala', 'Béni Yenni',
    'Boghni', 'Boudjima', 'Draâ Ben Khedda', 'Draâ El Mizan', 'Freha',
    'Iferhounène', 'Larbaâ Nath Irathen', 'Mâatkas', 'Makouda', 'Mekla',
    'Ouadhia', 'Ouaguenoun', 'Tigzirt', 'Timizart', 'Tirmitine'
  ],
  'Béjaïa': [
    'Béjaïa', 'Adekar', 'Aït Rizine', 'Akbou', 'Amizour',
    'Aokas', 'Barbacha', 'Beni Djellil', 'Beni Ksila', 'Beni Maouche',
    'Boudjellil', 'Bouhamza', 'Chemini', 'Darguina', 'Draâ El Kaïd',
    'El Kseur', 'Feraoun', 'Ighil Ali', 'Ighram', 'Kherrata'
  ],
  'Mostaganem': [
    'Mostaganem', 'Aïn Nouïssy', 'Aïn Sidi Chérif', 'Aïn Tedeles', 'Bouguirat',
    'Fornaka', 'Hassi Mameche', 'Hassi R\'Mel', 'Kheïr Eddine', 'Mazagran',
    'Mesra', 'Nekmaria', 'Oued El Kheïr', 'Safsaf', 'Sayada',
    'Sidi Ali', 'Sidi Belaattar', 'Sidi Lakhdar', 'Sour', 'Stidia'
  ],
  'Boumerdès': [
    'Boumerdès', 'Bordj Menaïel', 'Boudouaou', 'Boudouaou El Bahri', 'Corso',
    'Dellys', 'Hamr El Aïn', 'Isser', 'Khemis El Khechna', 'Larbatache',
    'Naciria', 'Ouled Aïssa', 'Ouled Hedadj', 'Ouled Moussa', 'Si Mustapha',
    'Thenia', 'Tidjelabine', 'Zemmouri', 'Zemmouri El Bahri'
  ],
  'Tipaza': [
    'Tipaza', 'Ahmer El Aïn', 'Aïn Tagourait', 'Attatba', 'Bou Ismaïl',
    'Bouharoun', 'Chaïba', 'Cherchell', 'Damous', 'Douaouda',
    'Fouka', 'Gouraya', 'Hadjout', 'Kolea', 'Larhat',
    'Menaceur', 'Messelmoun', 'Nador', 'Sidi Amar', 'Sidi Rached',
    'Sidi Semiane'
  ],
  'Chlef': [
    'Chlef', 'Abou El Hassan', 'Aïn Merane', 'Benairia', 'Beni Bouattab',
    'Beni Haoua', 'Beni Rached', 'Boukadir', 'Bouzeghaia', 'Breira',
    'Chettia', 'Dahra', 'El Karimia', 'El Marsa', 'Harchoun',
    'Labiod Medjadja', 'Moussadek', 'Oued Fodda', 'Oued Goussine', 'Oued Sly',
    'Ouled Abbes', 'Ouled Ben Abdelkader', 'Ouled Fares', 'Sendjas', 'Sidi Abderrahmane',
    'Sidi Akkacha', 'Sobha', 'Tadjena', 'Talassa', 'Taougrit',
    'Tenès', 'Zeboudja'
  ],
  'Batna': [
    'Batna', 'Aïn Djasser', 'Aïn Touta', 'Aïn Yagout', 'Arris',
    'Azil Abderrahmane', 'Barika', 'Belezma', 'Beni Foudhala El Hakania', 'Bitam',
    'Boulhilat', 'Boumagueur', 'Boumia', 'Chemora', 'Djezar',
    'El Madher', 'Fesdis', 'Foum Toub', 'Ghassira', 'Hidoussa',
    'Ksar Belezma', 'Larbaa', 'Lazrou', 'Lemcene', 'M\'Doukel',
    'Menaâ', 'Merouana', 'N\'Gaous', 'Oued Chaaba', 'Oued El Ma',
    'Ouled Ammar', 'Ouled Aouf', 'Ouled Fadel', 'Ouled Si Slimane', 'Ras El Aioun',
    'Seggana', 'Seriana', 'Tazoult', 'T\'Kout', 'Théniet El Abed',
    'Timgad', 'Zanet El Beida'
  ]
};

// Add default communes for wilayas not listed above
ALGERIA_WILAYAS.forEach(wilaya => {
  if (!WILAYA_COMMUNES[wilaya.name]) {
    WILAYA_COMMUNES[wilaya.name] = [
      `${wilaya.name} Centre`,
      `${wilaya.name} Est`,
      `${wilaya.name} Ouest`,
      `${wilaya.name} Sud`,
      `${wilaya.name} Nord`
    ];
  }
});

// Product sizes
export const PRODUCT_SIZES = ['S', 'M', 'L', 'XL'];

// Product colors
export const PRODUCT_COLORS = [
  { name: 'Grey', value: 'grey', hex: '#808080' },
  { name: 'White', value: 'white', hex: '#FFFFFF' }
];

