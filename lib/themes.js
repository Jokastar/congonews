// Theme taxonomy and seed examples for k-NN assignment
// Adapted for African and DR Congo context

export const THEMES = [
  {
    name: 'politique',
    seeds: [
      // Institutional terms
      'élection', 'gouvernement', 'président', 'parlement', 'assemblée nationale', 'sénat',
      'ministre', 'député', 'gouverneur', 'province', 'CENI', 'vote', 'scrutin', 'démocratie',
      'constitution', 'loi', 'décret', 'ordonnance', 'politique', 'pouvoir', 'autorité',
      'législatif', 'exécutif', 'judiciaire', 'institution', 'état',
      
      // Political actors & parties
      'parti politique', 'coalition', 'opposition', 'politicien', 'chef d\'État',
      'premier ministre', 'cabinet', 'parlementaire', 'sénateur',
      
      // Political processes
      'campagne', 'mandat', 'réforme', 'transition', 'dialogue', 'consensus', 'alternance',
      'discours', 'débat', 'rassemblement', 'manifestation', 'protestation', 'revendication',
      'grève', 'mobilisation', 'sit-in', 'marche',
      
      // Governance issues
      'corruption', 'transparence', 'bonne gouvernance', 'état de droit', 'justice',
      'tribunal', 'procès', 'impeachment', 'destitution', 'nomination', 'remaniement',
      'scandale politique', 'affaire judiciaire', 'droits humains',
      
      // Regional & international
      'diplomatie', 'Union Africaine', 'SADC', 'CEEAC', 'francophonie', 'sommet',
      'sanctions', 'coopération', 'relations bilatérales', 'accord', 'traité',
      'ambassade', 'ambassadeur', 'visite officielle', 'protocole',
      
      // Security & conflict
      'sécurité', 'conflit', 'paix', 'état de siège', 'armée', 'FARDC', 'police',
      'milice', 'rébellion', 'désarmement', 'cessez-le-feu', 'forces armées',
      'maintien de l\'ordre', 'insécurité', 'instabilité'
    ]
  },
  
  {
    name: 'economie',
    seeds: [
      // Mining & minerals
      'cobalt', 'coltan', 'cuivre', 'diamant', 'or', 'cassitérite', 'zinc', 'étain',
      'mine', 'minier', 'extraction', 'exploitation minière', 'carrière',
      'minerai', 'ressources naturelles', 'ressources minières', 'ceinture de cuivre',
      'gisement', 'prospection',
      
      // Energy
      'électricité', 'énergie', 'barrage', 'hydroélectricité', 'centrale électrique',
      'délestage', 'énergie renouvelable', 'solaire', 'groupe électrogène',
      
      // General economy
      'économie', 'marché', 'commerce', 'entreprise', 'finance', 'investissement',
      'inflation', 'emploi', 'chômage', 'industrie', 'croissance', 'PIB', 'développement',
      'récession', 'dette', 'budget', 'déficit', 'excédent',
      
      // Financial institutions
      'banque', 'banque centrale', 'franc congolais', 'dollar', 'monnaie', 'devise',
      'crédit', 'microfinance', 'mobile money', 'taux de change', 'épargne',
      
      // Trade & business
      'exportation', 'importation', 'douane', 'port', 'frontière', 'corridor',
      'entrepreneur', 'PME', 'startup', 'business', 'fiscalité', 'taxe', 'impôt',
      'tarif douanier', 'balance commerciale',
      
      // Infrastructure
      'infrastructure', 'route', 'chemin de fer', 'aéroport', 'télécommunication',
      'construction', 'projet', 'partenariat public-privé', 'zone économique',
      'réhabilitation', 'aménagement',
      
      // Agriculture
      'agriculture', 'plantation', 'cacao', 'café', 'huile de palme', 'manioc',
      'pêche', 'élevage', 'agro-industrie', 'sécurité alimentaire', 'récolte',
      'semence', 'irrigation', 'coopérative agricole'
    ]
  },
  
  {
    name: 'art',
    seeds: [
      // Music & dance
      'rumba', 'ndombolo', 'soukous', 'sebene', 'folklore', 'musique', 'musicien',
      'artiste', 'chanteur', 'orchestre', 'concert', 'festival', 'chanson',
      'album', 'clip', 'scène', 'spectacle', 'danse', 'chorégraphie',
      
      // Languages & literature
      'lingala', 'swahili', 'kikongo', 'tshiluba', 'français', 'langue nationale',
      'dialecte', 'traduction', 'littérature', 'poésie', 'écrivain', 'roman',
      'livre', 'publication', 'édition', 'récit', 'conte',
      
      // Visual & performing arts
      'cinéma', 'film', 'télévision', 'théâtre', 'peinture', 'sculpture',
      'art contemporain', 'galerie', 'exposition', 'photographe', 'documentaire',
      'bande dessinée', 'installation', 'performance', 'acteur', 'réalisateur',
      
      // Cultural heritage
      'patrimoine', 'tradition', 'coutume', 'ancestral', 'masque', 'artisanat',
      'tissage', 'céramique', 'statuette', 'tambour', 'danse traditionnelle',
      'rituel', 'culte', 'spiritualité',
      
      // Media
      'radio', 'presse', 'média', 'journalisme', 'émission', 'reportage',
      'chronique', 'podcast', 'streaming',
      
      // Fashion & lifestyle
      'mode', 'SAPE', 'sapeur', 'wax', 'pagne', 'style', 'créateur',
      'défilé', 'mannequin', 'tendance', 'élégance', 'couture',
      
      // Cuisine
      'cuisine', 'gastronomie', 'pondu', 'fufu', 'chikwangue', 'liboke',
      'maboke', 'ntaba', 'plat traditionnel', 'restaurant', 'chef cuisinier',
      
      // Religion & spirituality
      'église', 'cathédrale', 'mosquée', 'religion', 'christianisme', 'islam',
      'église de réveil', 'pasteur', 'prêtre', 'pèlerinage', 'culte', 'foi'
    ]
  },
  
  {
    name: 'fait_divers',
    seeds: [
      // Crime & security
      'accident', 'incendie', 'vol', 'cambriolage', 'agression', 'crime',
      'arrestation', 'police', 'enquête', 'témoin', 'victime', 'suspect',
      'procès', 'condamnation', 'prison', 'délit', 'violence', 'meurtre',
      
      // Traffic & transport
      'circulation', 'embouteillage', 'accident de la route', 'collision',
      'transport en commun', 'taxi', 'bus', 'moto', 'chauffeur', 'piéton',
      
      // Weather & natural disasters
      'météo', 'pluie', 'inondation', 'glissement de terrain', 'érosion',
      'tempête', 'catastrophe naturelle', 'sécheresse', 'éboulement',
      
      // Social issues
      'quartier', 'commune', 'voisinage', 'communauté', 'dispute', 'conflit',
      'palabre', 'médiation', 'chef de quartier', 'résident', 'habitant',
      
      // Health & emergencies
      'hôpital', 'urgence', 'ambulance', 'blessé', 'malade', 'épidémie',
      'vaccination', 'pharmacie', 'soins', 'santé publique',
      
      // Education & youth
      'école', 'université', 'étudiant', 'élève', 'professeur', 'examen',
      'rentrée scolaire', 'grève scolaire', 'cours', 'campus',
      
      // Daily life
      'vie quotidienne', 'marché', 'prix', 'coût de la vie', 'logement',
      'eau', 'électricité domestique', 'approvisionnement', 'pénurie',
      'file d\'attente', 'ravitaillement',
      
      // Events & incidents
      'événement', 'incident', 'scandale', 'controverse', 'rumeur',
      'découverte', 'disparu', 'recherche', 'retrouvé', 'noyade',
      'chute', 'fuite', 'explosion', 'effondrement', 'sauvetage'
    ]
  }
]
