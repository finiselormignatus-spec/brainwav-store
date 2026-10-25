/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F6F2',
        surface: '#FFFFFF',
        hairline: '#C4CDBF',
        ink: '#0A1A12',
        muted: '#4D5E55',
        forest: '#0B2A1B',
        lime: '#B8F23A',
        royal: '#1F4FD6',
        navy: '#0A1F4E',
        danger: '#B42318',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        body: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
