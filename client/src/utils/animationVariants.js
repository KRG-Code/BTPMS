/**
 * Common animation variants for use across the application
 */

// Standard container animations with staggered children
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.1,
      when: "beforeChildren" 
    }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 } 
  }
};

// Item animations for children elements
export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: "spring",
      damping: 25,
      stiffness: 200
    }
  },
  exit: { 
    y: -20, 
    opacity: 0,
    transition: { duration: 0.15 } 
  }
};

// Interactive button animations
export const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 }
};

// Card animations
export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200
    }
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

// Modal animations
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  }
};

// Fade animations
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// Slide animations
export const slideFromRight = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200
    }
  },
  exit: { x: 50, opacity: 0, transition: { duration: 0.2 } }
};

export const slideFromLeft = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200
    }
  },
  exit: { x: -50, opacity: 0, transition: { duration: 0.2 } }
};
