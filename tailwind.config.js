// tailwind.config.js
module.exports = {
    purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            keyframes: {
                'fade-in-blur': {
                    '0%': {opacity: 0, filter: 'blur(10px)'},
                    '100%': {opacity: 1, filter: 'blur(0)'},
                },                'fade-in-blur2': {
                    '0%': {opacity: 1, filter: 'blur(0)'},
                    '60%': {opacity: .5, filter: 'blur(3px)'},
                    '100%': {opacity: 1, filter: 'blur(0)'},
                },
                'slide-in2': {
                    '0%': {transform: 'translateX(100%)', opacity: 0},
                    '50%': {transform: 'translateX(0)', opacity: 1},
                    '100%': {transform: 'translateX(-100%)', opacity: 0},
                },                'slide-in': {
                    '0%': {transform: 'translateX(100%)', opacity: 0},
                    '100%': {transform: 'translateX(0)', opacity: 1},
                },
                'pulse-gradient': {
                    '0%, 100%': {transform: 'scale(1)', opacity: '0.6'},
                    '50%': {transform: 'scale(1.5)', opacity: '1'},
                },
                fadeInBlur: {
                    '0%': { opacity: 0, filter: 'blur(4px)' },
                    '100%': { opacity: 1, filter: 'blur(0)' },
                },
                slideUpFade: {
                    '0%': { transform: 'translateY(0)', opacity: '1' },
                    '100%': { transform: 'translateY(-10px)', opacity: '0' },
                },


            },
            animation: {
                'fade-in-blur': 'fade-in-blur 0.3s ease-out forwards',
                'slide-in2': 'fade-in-blur2 1.2s ease-out  infinite',
                'pulse-gradient': 'pulse-gradient 1.5s ease-in-out infinite',
                'fade-in-blur2': 'fadeInBlur 0.6s ease-out forwards',
                'slide-up-fade': 'slideUpFade 0.6s ease-out forwards',


            },
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
};
