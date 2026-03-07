'use client'

import { motion } from 'framer-motion'
import { Building2, Brain, Zap } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import ProductCard from '@/components/ecosystem/ProductCard'
import FlowArrow from '@/components/ecosystem/FlowArrow'

const ATLAS_URL = process.env.NEXT_PUBLIC_ATLAS_URL || 'https://atlas.astrastudio.in'
const SPARK_URL = process.env.NEXT_PUBLIC_SPARK_URL || 'https://spark.astrastudio.in'

const products = [
  {
    name: 'Astra Atlas',
    tagline: 'Business Operations',
    color: 'blue' as const,
    icon: Building2,
    features: ['Billing & Invoices', 'Inventory Management', 'Customer Database', 'GST Reports'],
    stats: [{ label: 'Customers', value: '847' }, { label: 'Invoices', value: '2,341' }],
    link: ATLAS_URL,
  },
  {
    name: 'Astra Lens',
    tagline: 'AI Intelligence',
    color: 'indigo' as const,
    icon: Brain,
    features: ['AI Insights (Claude)', 'Smart Alerts', 'Business Chat', 'Trend Analysis'],
    stats: [{ label: 'Insights Today', value: '6' }, { label: 'Alerts Active', value: '4' }],
    link: '#',
    isCenter: true,
  },
  {
    name: 'Astra Spark',
    tagline: 'Marketing Automation',
    color: 'orange' as const,
    icon: Zap,
    features: ['WhatsApp Campaigns', 'Social Scheduling', 'Reel Scripts (AI)', 'Ad Budget Manager'],
    stats: [{ label: 'Messages/mo', value: '940' }, { label: 'Campaigns', value: '8' }],
    link: SPARK_URL,
  },
]

const steps = [
  {
    num: 1,
    title: 'Atlas captures data',
    desc: 'Every sale, every customer, every product update is recorded in real-time.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    num: 2,
    title: 'Lens analyzes and advises',
    desc: 'Claude AI reads the data, spots patterns, and recommends the next best action.',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    num: 3,
    title: 'Spark executes marketing',
    desc: 'Campaigns launch, messages are sent, and content is created — all from one click.',
    color: 'from-orange-500 to-orange-600',
  },
]

export default function EcosystemPage() {
  return (
    <>
      <Topbar
        title="Astra Studio Ecosystem"
        subtitle="One platform. Three products. Complete business intelligence."
      />

      <div className="p-6 max-w-6xl mx-auto w-full space-y-12">

        {/* Hero */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold gradient-text">
            The Complete Small Business OS for Bharat
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            From billing to marketing — Atlas, Lens, and Spark work together so you can focus on what matters: running your business.
          </p>
        </motion.div>

        {/* Ecosystem visual */}
        <div className="flex items-center gap-2">
          {products.map((product, i) => (
            <>
              <motion.div
                key={product.name}
                className="flex-1"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <ProductCard {...product} />
              </motion.div>

              {i < products.length - 1 && (
                <motion.div
                  key={`arrow-${i}`}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                >
                  <FlowArrow
                    label={i === 0 ? 'Data Flow' : 'Actions'}
                    fromColor={i === 0 ? '#3B82F6' : '#6366F1'}
                    toColor={i === 0 ? '#6366F1' : '#F97316'}
                  />
                </motion.div>
              )}
            </>
          ))}
        </div>

        {/* How it works */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 text-center mb-6">
            How it works
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="bg-[#0F1629] rounded-2xl p-5 border border-white/[0.06]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.15 }}
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-sm font-bold mb-3`}>
                  {step.num}
                </div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-xl font-bold text-white">
            Built for 6.3 crore small businesses in Bharat
          </p>
          <p className="text-slate-400 text-sm mt-1">No consultants. No complexity. Just clarity.</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <a
              href={ATLAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-lg border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition-colors"
            >
              Explore Atlas →
            </a>
            <a
              href={SPARK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-lg border border-orange-500/30 text-orange-400 text-sm font-medium hover:bg-orange-500/10 transition-colors"
            >
              Explore Spark →
            </a>
          </div>
        </motion.div>

      </div>
    </>
  )
}
