module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        'blue1':'#5FA8D3',
        'blue2':'#1B4965',
        'blue3': '#757bf0',
        'blue4': '#141db8',
        'blue5': '#757be6'
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
  ],
} 