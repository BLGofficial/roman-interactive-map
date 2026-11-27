/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Основен фон: тъмно графитено + вторичен фон: античен камък */
        obsidian: {
          950: '#101216',
          900: '#171a1f',
          800: '#24221e',
          700: '#35312a',
        },
        /* Текст: слонова кост + земни и пясъчни тонове */
        travertine: {
          50: '#f7f3e8',
          100: '#ece4d0',
          200: '#d7c9ad',
          300: '#b8a585',
          400: '#917f61',
        },
        /* Вторичен акцент: античен бронз и теракота */
        imperial: {
          500: '#a66836',
          600: '#8a5328',
          400: '#c4834c',
        },
        /* Акцент: антично злато */
        amberwarn: {
          500: '#c89d3c',
          400: '#dfb75c',
        },
        /* Земно-маслинено и патинирано зелено за потвърдени маркери */
        verdigris: {
          500: '#4a886f',
          400: '#66a98e',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
