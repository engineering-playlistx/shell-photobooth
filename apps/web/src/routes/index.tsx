import { createFileRoute } from '@tanstack/react-router'
import {
  Camera,
  CheckCircle,
  Download,
  Gift,
  Sparkles,
  Star,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative py-20 px-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 blur-3xl"></div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Photobooth Experience</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Discover Your
          <span className="block bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Personal Archetype
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Capture your moment, take our quiz, and unlock personalized insights
          about your style, preferences, and predictions
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 flex items-center gap-2"
            aria-label="Download Photobooth Desktop"
          >
            <Download className="w-5 h-5" />
            <span>Download Desktop App</span>
          </button>
          <button
            className="px-8 py-4 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500"
            aria-label="Learn more about Photobooth"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Camera,
      title: 'Photo Capture',
      description:
        'Capture beautiful moments with our intuitive camera interface',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Sparkles,
      title: 'Interactive Quiz',
      description:
        'Answer fun questions to discover your unique personality archetype',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Gift,
      title: 'Personalized Results',
      description: 'Get tailored recommendations just for you',
      color: 'from-pink-500 to-rose-500',
    },
  ]

  return (
    <section className="py-20 px-6 bg-slate-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need for an immersive photobooth experience
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-slate-600 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div
                  className={`w-16 h-16 rounded-lg bg-linear-to-br ${feature.color} flex items-center justify-center mb-6`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Take Photos',
      description:
        'Capture your best moments with our easy-to-use camera interface',
    },
    {
      number: '02',
      title: 'Complete Quiz',
      description: 'Answer questions about your preferences and personality',
    },
    {
      number: '03',
      title: 'Get Results',
      description:
        'Receive personalized insights and recommendations tailored to you',
    },
  ]

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Simple steps to unlock your personalized experience
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 relative z-10 hover:bg-slate-800/50 transition-all duration-200">
                <div className="text-6xl font-bold text-transparent bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text mb-4">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const benefits = [
    'Photobooth app',
    'Interactive quiz',
    'Personalized insights',
  ]

  return (
    <section className="py-20 px-6 bg-linear-to-b from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-sm font-medium mb-6">
          <Star className="w-4 h-4" />
          <span>Free to Download</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Discover Your Archetype?
        </h2>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Download Photobooth Desktop and start your personalized journey today
        </p>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 mb-8 max-w-2xl mx-auto">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {benefits.map((benefit, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-slate-300"
              >
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="px-10 py-5 bg-linear-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-bold text-lg rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 flex items-center gap-3 mx-auto"
          aria-label="Download Photobooth Desktop Application"
        >
          <Download className="w-6 h-6" />
          <span>Download Now</span>
        </button>
      </div>
    </section>
  )
}
