import {
  Bitcoin,
  CloudSun,
  Globe2,
  LayoutDashboard,
  ArrowLeftRight,
  Settings,
} from 'lucide-react'

export const domains = [
  {
    path: '/weather',
    title: 'Weather',
    icon: CloudSun,
    provider: 'Open-Meteo',
    description:
      'Explore conditions, forecasts, and patterns across locations.',
    question: 'How will conditions change?',
    phase: 2,
  },
  {
    path: '/currencies',
    title: 'Currencies',
    icon: ArrowLeftRight,
    provider: 'Frankfurter',
    description: 'Follow exchange rates and compare movement over time.',
    question: 'How are currencies moving?',
    phase: 3,
  },
  {
    path: '/economy',
    title: 'Economy',
    icon: Globe2,
    provider: 'World Bank',
    description: 'Put country-level indicators into historical context.',
    question: 'What is shaping economies?',
    phase: 4,
  },
  {
    path: '/crypto',
    title: 'Crypto',
    icon: Bitcoin,
    provider: 'CoinGecko',
    description: 'Explore digital assets, market activity, and price history.',
    question: 'Where is the market moving?',
    phase: 5,
  },
] as const

export const navigation = [
  { path: '/', title: 'Overview', icon: LayoutDashboard },
  ...domains,
  { path: '/settings', title: 'Settings', icon: Settings },
]
