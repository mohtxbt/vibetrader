/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff00ff',
          hotpink: '#ff1493',
          cyan: '#00ffff',
          yellow: '#ffff00',
          gold: '#ffd700',
          green: '#00ff00',
          red: '#ff3333',
          blue: '#00bfff',
          purple: '#9d00ff',
          orange: '#ff6600',
        },
        meme: {
          black: '#0a0012',
          dark: '#1a0020',
          gray: '#2d1f3d',
          muted: '#4a3860',
          light: '#b388ff',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      animation: {
        'wobble': 'wobble 0.3s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'flash': 'flash 0.5s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out infinite',
        'rainbow': 'rainbow 2s linear infinite',
      },
      keyframes: {
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        rainbow: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 0, 255, 0.3)',
        'glow-pink': '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 0, 0.5), 0 0 40px rgba(0, 255, 0, 0.3)',
        'glow-yellow': '0 0 20px rgba(255, 255, 0, 0.5), 0 0 40px rgba(255, 255, 0, 0.3)',
        'glow-multi': '0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(0, 255, 255, 0.3), 0 0 60px rgba(255, 255, 0, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(135deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
        'chaos-gradient': 'linear-gradient(45deg, #ff00ff, #ff6600, #ffff00, #00ff00, #00ffff, #9d00ff, #ff00ff)',
      },
    },
  },
  plugins: [],
};
