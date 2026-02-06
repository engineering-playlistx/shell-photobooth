import type { ReactNode } from "react";
import React, { createContext, useContext, useState } from "react";

export type Archetype =
  | "morning"
  | "midday"
  | "night"
  | "brunch"
  | "golden"
  | "chill";

type ArchetypeContent = {
  color: string[];
  soundtrack: string[];
  gift: string[];
  craving: string[];
  numbers: string[];
  prediction: string[];
};

export const CONTENT_TYPES = {
  color: "Lucky Holiday Color",
  soundtrack: "Season Soundtrack",
  gift: "Provence Gift Vibe",
  craving: "Festive Craving",
  numbers: "Lucky Numbers",
  prediction: "New-Year Prediction",
} as const;

export const ARCHETYPES: Record<
  Archetype,
  {
    title: string;
    scentCombo: string;
    contents: ArchetypeContent;
  }
> = {
  morning: {
    title: "The Soft Launch",
    scentCombo: "Morning",
    contents: {
      color: [
        "Honey Mist. Warmth with main-character glow.",
        "Rose Latte. Soft blush, delightfully charged",
        "Blush Coral. Serene, softly radiant",
      ],
      soundtrack: [
        "“Golden Hour” – JVKE. Feels like journaling that fixes your life.",
        "“Love You for a Long Time” – Maggie Rogers. Sweet but chaotic.",
        "“Sur Ma Bossa” – Courrier Sud. For your self-improvement.",
      ],
      gift: [
        "Shea Comfort Ritual, therapy in skincare form.",
        "Cherry Blossom Mist, gentle, floral, and 80% emotional support.",
        "Peony Eau de Toilette, gentle florals for those who feel deeply.",
      ],
      craving: [
        "Lemon madeleines, productivity, but make it pastry.",
        "Honey butter croissant, the taste of “I deserve this.”",
        "Pistachio gelato, the flavor of feeling put-together.",
      ],
      numbers: [
        "3 • 11 • 24 Calm looks good on you.",
        "7 • 18 • 33 Angel number for soft success.",
        "9 • 21 • 88 Subtle chaos, loud results.",
      ],
      prediction: [
        "Your radiance will spark “what’s your routine?” moments.",
        "One overthought fades, a new one beautifully arrives.",
        "A soft start that blossoms into a bold victory.",
      ],
    },
  },
  midday: {
    title: "The Main Character",
    scentCombo: "Midday",
    contents: {
      color: [
        "Zesty Gold. Bright, bold, delightfully audacious",
        "Amber Glow. Golden heat with a running-late charm",
        "Champagne Spark. Luminous charm that arrives first",
      ],
      soundtrack: [
        '"Agitations Tropicales" – L\'Impératrice. You glow differently.',
        "“Juice” – Lizzo. Confidence playlist on loop.",
        "“One More Time” – Daft Punk. For chaotic optimism.",
      ],
      gift: [
        "Verbena Zest Duo Sunlit freshness for vibrant hearts.",
        "Almond Shower Oil. Indulgent scent, quietly driven.",
        "Citrus Bloom Hand Cream. Fresh, lively, instantly inspiring.",
      ],
      craving: [
        "Sparkling cider. Classy chaos in liquid form.",
        "Almond biscotti. Bold bite, zero regrets.",
        "Butter cookies. Because subtlety is overrated.",
      ],
      numbers: [
        "9 • 13 • 21 The Lady of Composed Whimsy",
        "7 • 18 • 33 Lucky streak incoming.",
        "11 • 24 • 88 Too iconic for single digits.",
      ],
      prediction: [
        "Your moment will shine, accidentally iconic.",
        "Drama appears, but you remain radiant.",
        "A playful idea becomes a radiant success.",
      ],
    },
  },
  night: {
    title: "The Stargazer Diva",
    scentCombo: "Night",
    contents: {
      color: [
        "Velvet Plum. A classic mystery wrapped in richness",
        "Deep Mauve. Midnight mood, effortlessly iconic",
        "Midnight Rose. Moody charm with knowing grace",
      ],
      soundtrack: [
        '"Snooze" – SZA. Emotionally unavailable but beautifully so.',
        '"Pink + White" – Frank Ocean. Cinematic melancholy.',
        '"Maintenant ou jamais" – Catastrophe. Now or never.',
      ],
      gift: [
        "Terre de Lumière. Mini Bottled mystery.",
        "Lavender & Honey Calm Kit. Soothe the noise, beautifully.",
        "Néroli & Orchidée Perfume. Gentle elegance, unforgettable.",
      ],
      craving: [
        "Dark chocolate. The snack equivalent of deep conversation.",
        "Espresso shot. Because introspection needs caffeine.",
        "Panettone. You’re literally dessert with backstory.",
      ],
      numbers: [
        "7 • 24 • 33 Quiet magic, loud intuition.",
        "9 • 13 • 88 Your inner poet’s era.",
        "11 • 21 • 44 Wish granted energy.",
      ],
      prediction: [
        "Your slower replies will earn quiet respect it.",
        "A radiant glow-up with beautifully strong boundaries.",
        "Let go—and something lovely will come your way.",
      ],
    },
  },
  brunch: {
    title: "The Brunchcore",
    scentCombo: "Morning + Midday",
    contents: {
      color: [
        "Blush Coral. Soft blush with hydrated glow",
        "Honey Cream. Warm and beautifully uplifting.",
        "Provence Blue. Grounded calm with a spontaneous spark",
      ],
      soundtrack: [
        '"One on One" – Jafunk. Organized chaos anthem.',
        '"Man I Need" – Olivia Dean. Soft joy, chaotic charm.',
        "“Love You for a Long Time” – Maggie Rogers. Sincerity with rhythm.",
      ],
      gift: [
        "Cherry Blossom Mist. Bright mornings, breezy afternoons.",
        "Verbena & Citrus Duo. Zest for the social-at-heart.",
        "Shea Vanilla Hand Cream. Indulgent comfort, gently refined.",
      ],
      craving: [
        "Almond biscotti. Fun-sized ambition.",
        "Croissant & gossip. Soft-core productivity.",
        "Gingerbread. Sweet, spicy, slightly messy.",
      ],
      numbers: [
        "7 • 18 • 21 Good luck disguised as good timing.",
        "3 • 9 • 24 The number of why nots.",
        "11 • 13 • 33 Charm math: unpredictable + lovable.",
      ],
      prediction: [
        "A simple brunch becomes a beautiful new directions.",
        "Someone new will adore the charm only you have.",
        "A graceful “no” becomes your new favorite luxury.",
      ],
    },
  },
  golden: {
    title: "The Golden Baddie",
    scentCombo: "Midday + Night",
    contents: {
      color: [
        "Champagne Glow. Gently glowing at sunset",
        "Amber Champagne. Radiant, with fearless flair",
        "Rose Gold Dust. A real-life glow with main-character charm",
      ],
      soundtrack: [
        '"Ça ira ça ira" – The Pirouettes. Delusional in the best way.',
        '"Lisztomania" – Phoenix. Sparkle-core soul.',
        '"Magic" – Kylie Minogue. Proof you are the vibe.',
      ],
      gift: [
        "Rose & Almond Glow Set. Luminous, elegant, delightfully serene",
        "Terre de Lumière L’Eau. Golden-hour skin in scent form.",
        "Verbena Spark Lotion. Citrus light, charmingly unhurried.",
      ],
      craving: [
        "Sparkling cider. Main character hydration.",
        "Almond cookies. Glam gone slightly rogue.",
        "Panettone and confidence.",
      ],
      numbers: [
        "9 • 18 • 88 Bold moves, brighter glow.",
        "11 • 13 • 24 Chaos math: sparkle x ambition.",
        "7 • 33 • 21 Lights, camera, shimmer.",
      ],
      prediction: [
        "You’ll turn late arrivals into main entrances.",
        "You’ll glow, and the spotlight follows.",
        "A simple compliment will soothe you beautifully.",
      ],
    },
  },
  chill: {
    title: "The Glow Manifestor",
    scentCombo: "Night + Morning",
    contents: {
      color: [
        "Moonlit Cream. Soft, luminous, effortlessly indulgent.",
        "Lavender Dust. Soothing and beautifully serene",
        "Soft Silver Mist. Soothing glow with a touch of mystery.",
      ],
      soundtrack: [
        '"Pink + White" – Frank Ocean. Soft flex soundtrack.',
        '"Beyond" – Leon Bridges. Peace you can hum to.',
        '"Que Je T’aime" – Camille. Soul-level serenity.',
      ],
      gift: [
        "Shea & Lumière Duo. Your inner calm in lotion form.",
        "Lavender & Honey Calm Kit Serenity that shines through.",
        "Néroli & Orchidée Mini. Delicate scent, subtle strength.",
      ],
      craving: [
        "Croissant & quiet victories. Pastry manifestation.",
        "Espresso in peace. Caffeine with boundaries.",
        "Pistachio gelato. Dessert, but grounded.",
      ],
      numbers: [
        "3 • 11 • 33 Soft power sequence.",
        "7 • 18 • 44 Luck disguised as calm.",
        "24 • 13 • 88 Your glow math adds up.",
      ],
      prediction: [
        "Your wishes unfold effortlessly.",
        "Quiet days will bring your greatest glow.",
        "The energy you draw in will match your strength.",
      ],
    },
  },
} as const;

interface QuizResult {
  archetype: Archetype;
}

interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

interface PhotoboothContextType {
  finalPhoto: string | null;
  quizResult: QuizResult | null;
  originalPhotos: string[];
  userInfo: UserInfo | null;
  setFinalPhoto: (photo: string | null) => void;
  setQuizResult: (result: QuizResult | null) => void;
  setOriginalPhotos: (photos: string[]) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  reset: () => void;
}

const PhotoboothContext = createContext<PhotoboothContextType | undefined>(
  undefined,
);

export function PhotoboothProvider({ children }: { children: ReactNode }) {
  const [finalPhoto, setFinalPhoto] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const reset = () => {
    setFinalPhoto(null);
    setQuizResult(null);
    setOriginalPhotos([]);
    setUserInfo(null);
  };

  return (
    <PhotoboothContext.Provider
      value={{
        originalPhotos,
        finalPhoto,
        quizResult,
        userInfo,
        setOriginalPhotos,
        setFinalPhoto,
        setQuizResult,
        setUserInfo,
        reset,
      }}
    >
      {children}
    </PhotoboothContext.Provider>
  );
}

export function usePhotobooth() {
  const context = useContext(PhotoboothContext);
  if (context === undefined) {
    throw new Error("usePhotobooth must be used within a PhotoboothProvider");
  }
  return context;
}
