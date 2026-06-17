/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'mineral': {
          '50': '#f5f7fa',
          '100': '#e4e9f2',
          '200': '#c9d3e5',
          '300': '#a3b4d0',
          '400': '#768db5',
          '500': '#556e9a',
          '600': '#42577d',
          '700': '#374765',
          '800': '#303d54',
          '900': '#2c3647',
          '950': '#1d2330',
        },
        'polar': {
          'red': '#8b2942',
          'orange': '#a85a23',
          'yellow': '#c9a227',
          'green': '#2d6a4f',
          'blue': '#1e4d6b',
          'purple': '#4a2c5a',
        }
      },
      fontFamily: {
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        'serif': ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'cross-polar': 'linear-gradient(45deg, #1a1a2e 25%, #16213e 25%, #16213e 50%, #1a1a2e 50%, #1a1a2e 75%, #16213e 75%)',
      },
      backgroundSize: {
        'cross-polar': '20px 20px',
      }
    },
  },
  plugins: [],
}
