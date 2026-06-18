/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    // Update these paths to match your actual file structure
    './src/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/components/dashboard/**/*.{js,jsx,ts,tsx}',
    './src/components/marketplace/**/*.{js,jsx,ts,tsx}',
    './src/components/auth/**/*.{js,jsx,ts,tsx}',
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/contexts/**/*.{js,jsx,ts,tsx}',
    './src/hooks/**/*.{js,jsx,ts,tsx}',
    './src/lib/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        // Kraft — Dealtock brand ramp (bordereau/tampon identity)
        kraft: {
          50: '#FAF6F0',
          100: '#F2E9DC',
          200: '#E3CFB2',
          300: '#D2B488',
          400: '#BC9C6C',
          500: '#AA8350',
          600: '#8F6B3F',
          700: '#735531',
          800: '#574025',
          900: '#3B2B18'
        },
        'stamp-red': 'hsl(var(--stamp-red))',
        'stamp-green': 'hsl(var(--stamp-green))'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Archivo Black"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: 0
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: 0
          }
        },
        'fade-in': {
          from: {
            opacity: 0
          },
          to: {
            opacity: 1
          }
        },
        'slide-in-left': {
          from: {
            transform: 'translateX(-100%)'
          },
          to: {
            transform: 'translateX(0)'
          }
        },
        'slide-out-left': {
          from: {
            transform: 'translateX(0)'
          },
          to: {
            transform: 'translateX(-100%)'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-out-left': 'slide-out-left 0.3s ease-out'
      },
      spacing: {
        '14': '3.5rem', // For navbar height
        '16': '4rem',   // For sidebar width
      }
    }
  },
  plugins: [require('tailwindcss-animate')],
};