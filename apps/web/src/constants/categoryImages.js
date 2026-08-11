export const CATEGORY_METADATA = {
  Action: {
    name: 'Action',
    subtitle: 'Explosive thrillers & blockbusters',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    mood: 'Adrenaline, Explosive, High-Octane',
  },
  'Sci-Fi': {
    name: 'Sci-Fi',
    subtitle: 'Futuristic worlds & deep space',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    mood: 'Mind-bending, Futuristic, Cosmic',
  },
  Horror: {
    name: 'Horror',
    subtitle: 'Supernatural chills & fear',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    mood: 'Chilling, Dark, Terrifying',
  },
  Comedy: {
    name: 'Comedy',
    subtitle: 'Laugh-out-loud hits',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    mood: 'Witty, Hilarious, Lighthearted',
  },
  Anime: {
    name: 'Anime',
    subtitle: 'Epic fantasy & mecha sagas',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    mood: 'Epic, Stylized, Imaginative',
  },
  Drama: {
    name: 'Drama',
    subtitle: 'Compelling emotional stories',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    mood: 'Gripping, Intense, Emotional',
  },
  Documentary: {
    name: 'Documentary',
    subtitle: 'Real discoveries & nature',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    mood: 'Eye-opening, Inspiring, Deep',
  },
};

export function getCategoryVisual(categoryName) {
  if (!categoryName) return CATEGORY_METADATA.Action;
  const match = CATEGORY_METADATA[categoryName];
  if (match) return match;

  const lower = categoryName.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_METADATA)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }

  return {
    name: categoryName,
    subtitle: 'StreamFlix original selection',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    mood: 'Immersive, Cinematic, Captivating',
  };
}
