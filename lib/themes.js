// Theme taxonomy and seed examples for k-NN assignment

export const THEMES = [
  {
    name: 'politics',
    seeds: [
      'election', 'government', 'president', 'parliament', 'political party',
      'vote', 'democracy', 'minister', 'policy', 'law', 'diplomacy', 'sanctions'
    ]
  },
  {
    name: 'humanitarian',
    seeds: [
      'refugee', 'aid', 'crisis', 'disaster', 'NGO', 'unicef', 'red cross',
      'emergency', 'relief', 'donation', 'evacuation', 'shelter', 'food security'
    ]
  },
  {
    name: 'economy',
    seeds: [
      'economy', 'market', 'trade', 'business', 'finance', 'investment',
      'inflation', 'job', 'employment', 'industry', 'growth', 'bank', 'stock'
    ]
  },
  {
    name: 'health',
    seeds: [
      'health', 'hospital', 'doctor', 'disease', 'covid', 'malaria', 'vaccine',
      'clinic', 'medicine', 'treatment', 'public health', 'epidemic', 'pandemic'
    ]
  },
  {
    name: 'sports',
    seeds: [
      'football', 'soccer', 'basketball', 'athlete', 'match', 'tournament',
      'goal', 'score', 'league', 'championship', 'coach', 'player', 'team'
    ]
  }
]

// Utility to get all theme names
export const THEME_NAMES = THEMES.map(t => t.name)
