/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // 🔥 BREAKPOINTS ESTÁNDAR Y CORRECTOS
        'xs': '475px',      // Extra small devices
        'sm': '640px',      // Small devices (tablets en portrait)
        'md': '768px',      // Medium devices (tablets en landscape) 
        'lg': '1024px',     // Large devices (laptops)
        'xl': '1280px',     // Extra large devices (desktops)
        '2xl': '1536px',    // 2X large devices (large desktops)
        
        // 🎯 BREAKPOINTS PERSONALIZADOS PARA TU PROYECTO
        'mobile': '320px',   // Móviles pequeños
        'tablet': '768px',   // Tablets (no 1340px!)
        'laptop': '1024px',  // Laptops
        'desktop': '1280px', // Escritorios
        
        // 📱 BREAKPOINTS POR RANGO (si los necesitas)
        'mobile-only': {'max': '767px'},          // Solo móviles
        'tablet-only': {'min': '768px', 'max': '1023px'}, // Solo tablets
        'desktop-up': {'min': '1280px'},          // Desktop y más grande
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}