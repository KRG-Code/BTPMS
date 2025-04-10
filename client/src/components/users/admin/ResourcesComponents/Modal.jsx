import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTheme } from '../../../../contexts/ThemeContext';

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: 'spring', 
      damping: 25,
      stiffness: 500
    } 
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
    transition: { duration: 0.2 } 
  }
};

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  className = '',
  overlayClassName = '',
  maxWidth = '4xl',
  maxHeight = '90vh',
  closeOnOverlayClick = true,
  preventScroll = true,
  position = 'center',
  animation = true,
  zIndex = 50
}) => {
  const { isDarkMode } = useTheme();
  
  // Prevent scrolling on the body when modal is open
  useEffect(() => {
    if (isOpen && preventScroll) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-prevent-scroll');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-prevent-scroll');
    };
  }, [isOpen, preventScroll]);
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  // Don't render if not open
  if (!isOpen) return null;
  
  // Determine positioning classes
  const positionClasses = {
    'center': 'items-center justify-center',
    'top': 'items-start justify-center pt-20',
    'bottom': 'items-end justify-center pb-20'
  };
  
  // Determine max-width classes
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    'full': 'max-w-full'
  };
  
  const Wrapper = animation ? motion.div : 'div';
  const AnimatedContent = animation ? motion.div : 'div';
  
  // Base overlay and content classes
  const baseOverlayClasses = `fixed inset-0 flex p-4 overflow-y-auto backdrop-blur-sm`;
  const baseContentClasses = `w-full m-auto rounded-xl shadow-xl flex flex-col theme-transition overflow-hidden`;
  
  const modalContent = (
    <Wrapper
      className={`${baseOverlayClasses} ${positionClasses[position] || positionClasses.center} 
        ${overlayClassName} z-[${zIndex}]`}
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.5)',
        touchAction: 'pan-y' 
      }}
      onClick={closeOnOverlayClick ? onClose : undefined}
      {...(animation ? { 
        variants: overlayVariants,
        initial: "hidden",
        animate: "visible",
        exit: "exit" 
      } : {})}
    >
      <AnimatedContent
        className={`${baseContentClasses} ${maxWidthClasses[maxWidth] || maxWidthClasses['4xl']} ${className}`}
        style={{ maxHeight }}
        onClick={e => e.stopPropagation()}
        {...(animation ? { 
          variants: modalVariants,
          initial: "hidden",
          animate: "visible",
          exit: "exit" 
        } : {})}
      >
        {children}
      </AnimatedContent>
    </Wrapper>
  );
  
  // Create portal to render at the end of the document body
  return createPortal(
    modalContent,
    document.getElementById('modal-root') || document.body
  );
};

export default Modal;
