import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FeatureCard from '../components/features/FeatureCard';
import { Container } from '../components/ui/Container';
import { useDemo } from '../contexts/DemoContext';
import { 
  Calculator, 
  BarChart3, 
  Clock, 
  ArrowRight, 
  Check, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  Smartphone, 
  Mail,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  BarChart2,
  Percent,
  DollarSign,
  UserPlus,
  PlayCircle
} from 'lucide-react';

interface SectionRefs {
  features: React.RefObject<HTMLDivElement>;
  pricing: React.RefObject<HTMLDivElement>;
  contact: React.RefObject<HTMLDivElement>;
  faq: React.RefObject<HTMLDivElement>;
}

const HomePage = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  const { startDemo } = useDemo();
  
  // Create refs for each section
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  
  // Create a refs object to pass to child components
  const sectionRefs: SectionRefs = {
    features: featuresRef,
    pricing: pricingRef,
    contact: contactRef,
    faq: faqRef
  };

  // Check if sections are in view for animations
  const isInViewHero = useInView(heroRef, { once: true });
  const isInViewFeatures = useInView(featuresRef, { once: true, margin: "-100px" });
  const isInViewPricing = useInView(pricingRef, { once: true, margin: "-100px" });
  const isInViewFaq = useInView(faqRef, { once: true, margin: "-100px" });

  const features = [
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Profit Calculation",
      description: "Accurately calculate profit margins on each frame, taking into account all costs and pricing.",
      linkTo: "/calculator"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Track key performance indicators, analyze trends, and identify areas for improvement.",
      linkTo: "/dashboard"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Time-Saving Automation",
      description: "Automate repetitive tasks, freeing up your time to focus on customer service and business growth.",
      linkTo: "/time-saving"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your data is encrypted and protected with enterprise-grade security measures.",
      linkTo: "/about"
    }
  ];

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 md:p-8">
        <Container size="xl">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white rounded-lg mb-12">
          <div className="px-6 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              >
                Maximize Your Frame Profits
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
              >
                OptiProfit is the ultimate tool for optical businesses to accurately calculate frame profits, optimize pricing strategies, and boost overall profitability.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link 
                  to="/calculator"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Start Calculating
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button
                  onClick={startDemo}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <PlayCircle className="mr-2 w-5 h-5" />
                  Try Demo
                </button>
                <Link 
                  to="/dashboard"
                  className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 font-medium py-3 px-8 rounded-lg transition-all duration-300 flex items-center justify-center"
                >
                  View Dashboard
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Homepage Image */}
        <section className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center"
          >
            <div className="max-w-4xl mx-auto px-4">
              <img 
                src="/images/homepage_1.png" 
                alt="OptiProfit Dashboard Preview" 
                className="w-full h-auto rounded-lg shadow-lg border border-gray-200"
              />
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-lg text-gray-600">
              OptiProfit offers a range of powerful features designed to help you manage and grow your optical business.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                linkTo={feature.linkTo}
                delay={index * 0.1}
              />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-bold text-white mb-4"
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-blue-100 mb-6"
          >
            Jump right into calculating profits, explore your saved data, or create your account to get started.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              to="/calculator"
              className="bg-white hover:bg-gray-100 text-blue-700 font-medium py-3 px-8 rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              Calculate Profits
              <Calculator className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              to="/dashboard"
              className="bg-transparent hover:bg-white/10 text-white border border-white font-medium py-3 px-8 rounded-lg transition-all duration-300 flex items-center justify-center"
            >
              View Analytics
              <BarChart3 className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6"
          >
            <button 
              onClick={() => {/* Demo signup functionality */}}
              className="inline-flex items-center px-6 py-3 bg-blue-800 hover:bg-blue-900 text-white font-medium rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              <UserPlus className="mr-2 w-5 h-5" />
              Sign Up Free
            </button>
            <p className="text-sm text-blue-200 mt-2">
              No credit card required • Start saving time today
            </p>
          </motion.div>
        </section>
        </Container>
      </div>
    </div>
  );
};

export default HomePage;
