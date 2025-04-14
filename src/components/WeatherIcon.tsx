import { motion } from 'framer-motion';
import { IconType } from '../types/prayer';
import { useRef, useEffect } from 'react';

// Optimisation: ajout d'un hook custom pour limiter les animations selon la performance du périphérique
const useReducedMotion = () => {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return prefersReducedMotion;
};

const WeatherIcon: React.FC<{ type: IconType }> = ({ type }) => {
  const reducedMotion = useReducedMotion();
  const isVisible = useRef(true);
  
  // Optimisation: réduire les animations quand l'élément n'est pas visible
  useEffect(() => {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        isVisible.current = entries[0]?.isIntersecting ?? true;
      }, { threshold: 0.1 });
      
      const element = document.getElementById(`weather-icon-${type}`);
      if (element) observer.observe(element);
      
      return () => {
        if (element) observer.unobserve(element);
      };
    }
  }, [type]);
  
  // Simplifier les animations et réduire leur fréquence
  const getAnimationProps = (baseProps: any) => {
    if (reducedMotion) {
      return { animate: {}, transition: { duration: 0 } };
    }
    
    // Réduire la durée et la complexité des animations
    const transition = {
      ...baseProps.transition,
      duration: baseProps.transition.duration * 1.5, // Animations plus lentes consomment moins de CPU
      repeat: Infinity,
      repeatDelay: 0.5 // Ajouter un délai entre les répétitions
    };
    
    return {
      ...baseProps,
      transition
    };
  };
  
  switch (type) {
    case 'dawn':
      return (
        <div className="w-20 h-20 relative" id={`weather-icon-${type}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Glow effect behind sun - optimisé */}
            <motion.div 
              className="absolute w-12 h-12 rounded-full bg-orange-300 opacity-30 blur-md"
              {...getAnimationProps({
                animate: { 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2] 
                },
                transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
              })}
              style={{ 
                willChange: 'transform, opacity', // Optimisation pour le GPU
                transform: reducedMotion ? 'scale(1.1)' : undefined
              }}
            />
            
            {/* Sun rising - optimisé */}
            <motion.div 
              className="w-10 h-10 bg-gradient-to-b from-yellow-300 to-orange-400 rounded-full"
              initial={{ y: 10, opacity: 0.7 }}
              {...getAnimationProps({
                animate: { 
                  y: [10, 0, 5],
                  opacity: [0.7, 1, 0.9] 
                },
                transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
              })}
              style={{ willChange: 'transform, opacity' }}
            />
            
            {/* Sun rays - réduit le nombre de rayons */}
            {(!reducedMotion ? [...Array(6)] : [...Array(4)]).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute w-1 h-4 bg-yellow-300 origin-bottom"
                style={{ 
                  transform: `rotate(${i * 60}deg) translateY(-10px)`,
                }}
                {...getAnimationProps({
                  animate: { 
                    opacity: [0.3, 0.7, 0.3],
                    height: [3, 5, 3]
                  },
                  transition: { 
                    repeat: Infinity, 
                    duration: 2, 
                    ease: "easeInOut", 
                    delay: i * 0.2 // Augmenter le délai pour réduire les animations simultanées
                  }
                })}
              />
            ))}
            
            {/* Horizon line with gradient */}
            <motion.div 
              className="absolute bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-400 to-orange-300"
              {...getAnimationProps({
                animate: { opacity: [0.4, 0.8, 0.4] },
                transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
              })}
            />
          </div>
        </div>
      );
    case 'noon':
      return (
        <div className="w-20 h-20 relative" id={`weather-icon-${type}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Strong sun glow - optimisé */}
            <motion.div 
              className="absolute w-14 h-14 rounded-full bg-yellow-300 opacity-20 blur-md"
              {...getAnimationProps({
                animate: { 
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.3, 0.2] 
                },
                transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
              })}
              style={{ 
                willChange: 'transform, opacity',
                transform: reducedMotion ? 'scale(1.15)' : undefined
              }}
            />
            
            {/* Sun at noon - optimisé avec CSS pour l'effet de lueur */}
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-lg"
              style={{ 
                boxShadow: '0 0 25px 7px rgba(255, 255, 0, 0.35)',
                willChange: reducedMotion ? 'auto' : 'transform, box-shadow'
              }}
              {...(reducedMotion ? {} : getAnimationProps({
                animate: { 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 20px 5px rgba(255, 255, 0, 0.3)',
                    '0 0 30px 8px rgba(255, 255, 0, 0.4)',
                    '0 0 20px 5px rgba(255, 255, 0, 0.3)'
                  ]
                },
                transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
              }))}
            />
            
            {/* Sun rays - nombre réduit, animés moins souvent */}
            {(!reducedMotion ? [...Array(8)] : [...Array(4)]).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute w-1 h-6 bg-gradient-to-t from-yellow-400 to-yellow-200 origin-bottom"
                style={{ 
                  transform: `rotate(${i * 45}deg) translateY(-12px)`,
                }}
                {...getAnimationProps({
                  animate: { 
                    opacity: [0.4, 0.8, 0.4],
                    height: [5, 7, 5]
                  },
                  transition: { 
                    repeat: Infinity, 
                    duration: 3.5, // Plus lent
                    ease: "easeInOut", 
                    delay: i * 0.25 // Plus espacé
                  }
                })}
              />
            ))}
            
            {/* Small cloud - optimisé pour être statique en mode réduit */}
            {!reducedMotion && (
              <motion.div 
                className="absolute -bottom-2 w-16 h-7"
                {...getAnimationProps({
                  animate: { x: [-20, 5, -20] },
                  transition: { repeat: Infinity, duration: 30, ease: "easeInOut" } // Beaucoup plus lent
                })}
                style={{ willChange: 'transform' }}
              >
                <div className="absolute w-7 h-4 rounded-full bg-gray-200 left-2 top-1.5"></div>
                <div className="absolute w-5 h-5 rounded-full bg-gray-200 left-0 top-0"></div>
                <div className="absolute w-6 h-5 rounded-full bg-gray-200 left-6 top-0"></div>
                <div className="absolute w-4 h-4 rounded-full bg-gray-200 left-10 top-1"></div>
              </motion.div>
            )}
            {/* Nuage statique pour le mode réduit */}
            {reducedMotion && (
              <div className="absolute -bottom-2 w-16 h-7">
                <div className="absolute w-7 h-4 rounded-full bg-gray-200 left-2 top-1.5"></div>
                <div className="absolute w-5 h-5 rounded-full bg-gray-200 left-0 top-0"></div>
                <div className="absolute w-6 h-5 rounded-full bg-gray-200 left-6 top-0"></div>
                <div className="absolute w-4 h-4 rounded-full bg-gray-200 left-10 top-1"></div>
              </div>
            )}
          </div>
        </div>
      );
    case 'afternoon':
      return (
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Sun glow */}
            <motion.div 
              className="absolute w-12 h-12 rounded-full bg-orange-300 opacity-20 blur-sm"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2] 
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
            
            {/* Afternoon sun - slightly lower and more orange */}
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full"
              initial={{ x: 4, y: 2 }}
              animate={{ 
                y: [2, 4, 2],
                boxShadow: [
                  '0 0 15px 3px rgba(255, 173, 51, 0.3)',
                  '0 0 20px 5px rgba(255, 173, 51, 0.4)',
                  '0 0 15px 3px rgba(255, 173, 51, 0.3)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
            
            {/* Fewer sun rays */}
            {[...Array(8)].map((_, i) => (
              <motion.div 
                key={i}
                className="absolute w-1 h-5 bg-gradient-to-t from-orange-400 to-yellow-300 origin-bottom"
                style={{ 
                  transform: `rotate(${i * 45}deg) translateY(-10px)`,
                }}
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  height: [3, 5, 3]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3, 
                  ease: "easeInOut", 
                  delay: i * 0.15 
                }}
              />
            ))}
            
            {/* More clouds */}
            <motion.div 
              className="absolute -bottom-1 right-0 w-10 h-5"
              animate={{ x: [5, -5, 5] }}
              transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
            >
              <div className="absolute w-5 h-3 rounded-full bg-white opacity-90 left-1 top-1"></div>
              <div className="absolute w-4 h-4 rounded-full bg-white opacity-90 left-0 top-0"></div>
              <div className="absolute w-4 h-3 rounded-full bg-white opacity-90 left-3 top-0"></div>
            </motion.div>
          </div>
        </div>
      );
    case 'sunset':
      return (
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0">
            {/* Sky gradient backdrop */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500 via-pink-400 to-purple-600 opacity-20 rounded-lg"></div>
            
            {/* Sun glow */}
            <motion.div 
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-8 rounded-full bg-orange-500 opacity-30 blur-md"
              animate={{ 
                width: [12, 16, 12],
                opacity: [0.3, 0.4, 0.3] 
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
            
            {/* Setting sun */}
            <motion.div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-b from-orange-400 to-red-500 rounded-full -mb-5"
              animate={{ 
                y: [0, 1, 0],
                boxShadow: [
                  '0 0 15px 3px rgba(255, 100, 0, 0.3)',
                  '0 0 20px 5px rgba(255, 100, 0, 0.4)',
                  '0 0 15px 3px rgba(255, 100, 0, 0.3)'
                ] 
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
            
            {/* Horizon with gradient */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-purple-700 via-red-500 to-orange-400 rounded-b-lg"
              animate={{ opacity: [0.7, 0.9, 0.7] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
            
            {/* Clouds */}
            <motion.div 
              className="absolute bottom-2 left-2 w-6 h-3"
              animate={{ x: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            >
              <div className="absolute w-3 h-2 rounded-full bg-orange-200 opacity-80 left-0 top-0.5"></div>
              <div className="absolute w-2 h-2 rounded-full bg-orange-200 opacity-80 left-2 top-0"></div>
            </motion.div>
            
            <motion.div 
              className="absolute bottom-2 right-2 w-8 h-4"
              animate={{ x: [3, -3, 3] }}
              transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            >
              <div className="absolute w-4 h-2 rounded-full bg-orange-200 opacity-80 right-0 top-1"></div>
              <div className="absolute w-3 h-3 rounded-full bg-orange-200 opacity-80 right-3 top-0"></div>
              <div className="absolute w-2 h-2 rounded-full bg-orange-200 opacity-80 right-1 top-0"></div>
            </motion.div>
          </div>
        </div>
      );
    case 'night':
      return (
        <div className="w-20 h-20 relative" id={`weather-icon-${type}`}>
          <div className="absolute inset-0">
            {/* Night sky backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-blue-900 rounded-lg"></div>
            
            {/* Moon glow - optimisé */}
            <motion.div 
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-blue-100 opacity-20 blur-md"
              {...getAnimationProps({
                animate: { 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1] 
                },
                transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
              })}
              style={{ willChange: 'transform, opacity' }}
            />
            
            {/* Moon - optimisé */}
            <div 
              className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-gray-200 to-blue-100 rounded-full"
              style={{ 
                boxShadow: '0 0 12px 3px rgba(255, 255, 255, 0.35)'
              }}
            >
              {/* Moon craters */}
              <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 opacity-70"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 rounded-full bg-gray-300 opacity-70"></div>
              <div className="absolute top-3 right-1 w-0.5 h-0.5 rounded-full bg-gray-300 opacity-70"></div>
            </div>
            
            {/* Stars - optimisé et réduit */}
            {(!reducedMotion ? [...Array(8)] : [...Array(5)]).map((_, i) => {
              const size = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
              const x = Math.random() * 16; // 0 to 16
              const y = Math.random() * 8 + 2; // 2 to 10 (avoid bottom area)
              const delay = Math.random() * 3;
              const duration = Math.random() * 2 + 3; // 3 to 5 - plus lent
              
              return (
                <motion.div 
                  key={i}
                  className="absolute bg-white rounded-full"
                  style={{ 
                    width: `${size}px`, 
                    height: `${size}px`,
                    left: `${x}px`,
                    top: `${y}px`
                  }}
                  {...getAnimationProps({
                    animate: { 
                      opacity: [0.1, 0.8, 0.1],
                      scale: [1, size > 0.5 ? 1.3 : 1.1, 1]
                    },
                    transition: { 
                      repeat: Infinity, 
                      duration: duration, 
                      delay: delay,
                      ease: "easeInOut" 
                    }
                  })}
                />
              );
            })}
          </div>
        </div>
      );
    default:
      return null;
  }
};

export default WeatherIcon; 