import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
  linkTo?: string;
  onClick?: () => void;
}

const FeatureCard = ({ icon, title, description, delay = 0, linkTo, onClick }: FeatureCardProps) => {
  const cardContent = (
    <>
      {/* Subtle background effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

      {/* Icon container with animated background */}
      <motion.div
        className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300"
        whileHover={{ rotate: 5, scale: 1.1 }}
      >
        {icon}
      </motion.div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        {description}
      </p>

      {/* Animated underline effect */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-700 transition-colors duration-300">
        <span className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:gap-2 transition-all duration-300">
          Learn more
          <svg
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </span>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
      <div className="absolute -left-3 -top-3 w-6 h-6 bg-blue-200 dark:bg-blue-800/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
    </>
  );

  const motionProps = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, delay },
    whileHover: { y: -5 },
    className: "group relative p-6 bg-white dark:bg-[#1F2623] rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer"
  };

  if (linkTo) {
    return (
      <Link to={linkTo}>
        <motion.div {...motionProps}>
          {cardContent}
        </motion.div>
      </Link>
    );
  }

  if (onClick) {
    return (
      <motion.div {...motionProps} onClick={onClick}>
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div {...motionProps}>
      {cardContent}
    </motion.div>
  );
};

export default FeatureCard;
