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
  PlayCircle,
  Target,
  Lightbulb,
  Package,
  FileText,
  PieChart
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
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
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
  const isInViewHowItWorks = useInView(howItWorksRef, { once: true, margin: "-100px" });
  const isInViewBenefits = useInView(benefitsRef, { once: true, margin: "-100px" });
  const isInViewPricing = useInView(pricingRef, { once: true, margin: "-100px" });
  const isInViewFaq = useInView(faqRef, { once: true, margin: "-100px" });

  const features = [
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Smart Profit Calculation",
      description: "Calculate exact profit margins per frame with insurance billing, wholesale pricing, and cost breakdowns in real-time.",
      linkTo: "/calculator"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email-to-Inventory Automation",
      description: "Forward vendor order emails and watch them automatically convert into tracked inventory items with pricing and details.",
      linkTo: "/inventory"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Track profit trends, identify top-performing brands, and analyze vendor pricing patterns with visual dashboards.",
      linkTo: "/dashboard"
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: "Profit Comparison",
      description: "Compare profitability across multiple frames side-by-side to make data-driven purchasing decisions.",
      linkTo: "/profit-comparison"
    }
  ];

  const howItWorksSteps = [
    {
      number: "1",
      title: "Forward Your Vendor Emails",
      description: "Simply forward order confirmation emails from your vendors (Safilo, Luxottica, Modern Optical, etc.) to your unique OptiProfit email address.",
      icon: <Mail className="w-8 h-8" />
    },
    {
      number: "2",
      title: "Automatic Data Extraction",
      description: "Our AI-powered parser extracts frame details, pricing, and order information automatically. No manual data entry required.",
      icon: <Zap className="w-8 h-8" />
    },
    {
      number: "3",
      title: "Confirm Your Inventory",
      description: "Review extracted items, make any adjustments, and confirm to add them to your inventory tracking system.",
      icon: <Check className="w-8 h-8" />
    },
    {
      number: "4",
      title: "Calculate & Optimize Profits",
      description: "Use our profit calculator to determine optimal pricing, compare margins across vendors, and maximize profitability on every frame.",
      icon: <TrendingUp className="w-8 h-8" />
    }
  ];

  const benefits = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save 10+ Hours Per Week",
      description: "Eliminate manual data entry and spreadsheet calculations. Automate your entire inventory workflow."
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Increase Profit Margins by 15-30%",
      description: "Make data-driven pricing decisions. Know exactly what to charge to hit your target profit margins."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Make Better Buying Decisions",
      description: "Compare vendor pricing, identify profitable brands, and order the frames that make you the most money."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise-Grade Security",
      description: "Your data is encrypted, backed up, and protected with bank-level security. HIPAA-compliant infrastructure."
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Access Anywhere",
      description: "Cloud-based platform works on desktop, tablet, and mobile. Calculate profits on the sales floor or at home."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Built for Optical Professionals",
      description: "Designed specifically for optometrists and optical retailers by industry experts who understand your challenges."
    }
  ];

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 md:p-8">
        <Container size="xl">
        {/* Hero Section with Animation */}
        <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl mb-12 shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/animations/hero-data-viz-ezgif.com-optimize.gif')] bg-cover bg-center"></div>
          </div>
          <div className="relative px-6 py-20 md:py-28">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="text-white">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <span className="inline-block px-4 py-2 bg-blue-500/30 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
                      ✨ The Future of Optical Profitability
                    </span>
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                  >
                    Stop Guessing.<br />
                    Start <span className="text-yellow-300">Profiting</span>.
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-blue-100 mb-8 leading-relaxed"
                  >
                    OptiProfit transforms how optical businesses calculate frame profits, track inventory, and make purchasing decisions. Know exactly what to charge. Maximize every sale.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <Link
                      to="/calculator"
                      className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl flex items-center justify-center group"
                    >
                      Start Calculating Free
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button
                      onClick={startDemo}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 font-semibold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center"
                    >
                      <PlayCircle className="mr-2 w-5 h-5" />
                      Watch Demo
                    </button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-8 flex items-center gap-6 text-sm text-blue-100"
                  >
                    <div className="flex items-center">
                      <Check className="w-5 h-5 mr-2 text-green-300" />
                      No credit card required
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 mr-2 text-green-300" />
                      Free forever plan
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="relative hidden md:block"
                >
                  <div className="relative">
                    <img
                      src="/animations/hero-data-viz-ezgif.com-optimize.gif"
                      alt="OptiProfit Data Visualization"
                      className="w-full h-auto rounded-xl shadow-2xl border-4 border-white/20"
                    />
                    <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 text-green-800 rounded-full p-2">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">+32%</div>
                          <div className="text-sm text-gray-600">Avg. Profit Increase</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="text-gray-600 mb-6">Trusted by optical professionals nationwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="ml-2 text-gray-700 font-semibold">5.0 rating</span>
            </div>
            <div className="text-gray-700">
              <span className="font-bold text-blue-600">500+</span> frames analyzed monthly
            </div>
            <div className="text-gray-700">
              <span className="font-bold text-blue-600">$2M+</span> in profit optimized
            </div>
          </div>
        </motion.section>

        {/* The Problem Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 md:p-12 border border-red-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Running an Optical Business Is Hard Enough
                </h2>
                <p className="text-lg text-gray-700">
                  You shouldn't have to guess at your profits too.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-red-600 mb-3">❌</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Manually tracking inventory in spreadsheets</h3>
                  <p className="text-sm text-gray-600">Hours wasted entering SKUs, prices, and vendor details. One mistake ruins everything.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-red-600 mb-3">❌</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Guessing at profit margins</h3>
                  <p className="text-sm text-gray-600">Using rough estimates or "gut feel" to price frames. Are you actually making money?</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-red-600 mb-3">❌</div>
                  <h3 className="font-semibold text-gray-900 mb-2">No visibility into vendor pricing</h3>
                  <p className="text-sm text-gray-600">Which vendor gives you better margins? Which brands are most profitable? Who knows!</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-red-600 mb-3">❌</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Insurance calculations are a nightmare</h3>
                  <p className="text-sm text-gray-600">Figuring out reimbursement, coverage, and actual profit is complicated and error-prone.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* The Solution Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 border border-green-100">
              <div className="text-center mb-12">
                <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
                  💡 The OptiProfit Solution
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  We Built OptiProfit to Solve These Exact Problems
                </h2>
                <p className="text-lg text-gray-700">
                  A complete system designed specifically for optical retailers
                </p>
              </div>

              <div className="relative mb-8">
                <img
                  src="/images/hero-ar7-3-modern-saas.png"
                  alt="OptiProfit Solution Visualization"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
                  <div className="text-green-600 mb-3 text-2xl">✓</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Automatic inventory from emails</h3>
                  <p className="text-sm text-gray-600">Forward vendor emails. We extract everything automatically. Zero manual entry.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
                  <div className="text-green-600 mb-3 text-2xl">✓</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Exact profit calculations</h3>
                  <p className="text-sm text-gray-600">Know your exact profit on every frame. Insurance, wholesale, retail - all calculated instantly.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
                  <div className="text-green-600 mb-3 text-2xl">✓</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Vendor comparison analytics</h3>
                  <p className="text-sm text-gray-600">See which vendors and brands make you the most money. Make smarter purchasing decisions.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
                  <div className="text-green-600 mb-3 text-2xl">✓</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Insurance mode built-in</h3>
                  <p className="text-sm text-gray-600">Toggle insurance calculations on/off. See real profit after coverage and reimbursement.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section ref={howItWorksRef} className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How OptiProfit Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From vendor email to profit calculation in minutes. Here's how simple it is.
              </p>
            </div>

            <div className="relative">
              {/* Connection lines */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 -translate-y-1/2"></div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                {howItWorksSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-full">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full text-2xl font-bold mb-4 mx-auto shadow-lg">
                        {step.number}
                      </div>
                      <div className="text-blue-600 mb-4 flex justify-center">
                        {step.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">{step.title}</h3>
                      <p className="text-sm text-gray-600 text-center leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features Built for You</h2>
            <p className="text-lg text-gray-600">
              Everything you need to run a more profitable optical business
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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

        {/* Benefits Section */}
        <section ref={benefitsRef} className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Optical Businesses Love OptiProfit</h2>
              <p className="text-lg text-gray-600">
                Real results from real optical practices
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Screenshot/Demo Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="text-white">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    See OptiProfit in Action
                  </h2>
                  <p className="text-lg text-gray-300 mb-8">
                    Watch how easy it is to calculate profits, track inventory, and make data-driven decisions with OptiProfit.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <Check className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-1" />
                      <span className="text-gray-200">Real-time profit calculations as you type</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-1" />
                      <span className="text-gray-200">Beautiful visualizations of your data</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-1" />
                      <span className="text-gray-200">Intuitive interface designed for speed</span>
                    </li>
                  </ul>
                  <button
                    onClick={startDemo}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center group"
                  >
                    <PlayCircle className="mr-2 w-6 h-6 group-hover:scale-110 transition-transform" />
                    Launch Interactive Demo
                  </button>
                </div>
                <div>
                  <img
                    src="/images/homepage_1-min.png"
                    alt="OptiProfit Dashboard"
                    className="w-full h-auto rounded-xl shadow-2xl border-4 border-gray-700"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-12 text-center shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Stop Guessing and Start Profiting?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join optical professionals who are already using OptiProfit to maximize their frame profits and save hours every week.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/calculator"
                className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-4 px-10 rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl flex items-center justify-center group"
              >
                Start Free Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={startDemo}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 font-bold py-4 px-10 rounded-xl transition-all duration-300 flex items-center justify-center"
              >
                <PlayCircle className="mr-2 w-5 h-5" />
                Watch Demo First
              </button>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 text-blue-100 text-sm">
              <div className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-300" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-300" />
                Free forever plan available
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-300" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </section>
        </Container>
      </div>
    </div>
  );
};

export default HomePage;
