// Curated high-resolution static visual assets for all cinematic genres
export const CATEGORY_METADATA = {
  Action: {
    name: 'Action',
    subtitle: 'Explosive thrillers & blockbusters',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80', // Street race fire & action
    mood: 'Adrenaline, Explosive, High-Octane',
  },
  'Sci-Fi': {
    name: 'Sci-Fi',
    subtitle: 'Futuristic worlds & deep space',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', // Cyberpunk neon city hologram
    mood: 'Mind-bending, Futuristic, Cosmic',
  },
  Horror: {
    name: 'Horror',
    subtitle: 'Supernatural fear & psychological chills',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80', // Gothic haunted castle in moonlight
    mood: 'Ominous, Dark, Chilling',
  },
  Comedy: {
    name: 'Comedy',
    subtitle: 'Laugh-out-loud hits & stand-up specials',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', // Vintage spotlight stage microphone
    mood: 'Witty, Feel-good, Hilarious',
  },
  Anime: {
    name: 'Anime',
    subtitle: 'Epic Japanese animation & fantasy sagas',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80', // Japanese neon cyberpunk / anime battle
    mood: 'Action-packed, Vibrant, Fantastical',
  },
  Drama: {
    name: 'Drama',
    subtitle: 'Compelling stories & emotional journeys',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80', // Moody cinematic portrait
    mood: 'Emotional, Intimate, Thought-provoking',
  },
  Documentary: {
    name: 'Documentary',
    subtitle: 'Real stories, history & nature discoveries',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80', // Lush amazon wild nature aerial
    mood: 'Fascinating, Real, Eye-opening',
  },
  Thriller: {
    name: 'Thriller',
    subtitle: 'Edge-of-your-seat suspense & mysteries',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    mood: 'Suspenseful, Gritty, Unpredictable',
  },
};

export function getCategoryVisual(categoryName) {
  if (!categoryName) return CATEGORY_METADATA.Action;
  const key = Object.keys(CATEGORY_METADATA).find(
    (k) => k.toLowerCase() === categoryName.toLowerCase()
  );
  return CATEGORY_METADATA[key] || {
    name: categoryName,
    subtitle: `${categoryName} films & series`,
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    mood: 'Exciting, Premium, Cinematic',
  };
}
