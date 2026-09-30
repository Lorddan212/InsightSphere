import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CircleHelp,
  SunMoon,
} from 'lucide-react'
import type { ConditionCategory } from '../types/weather.types'

const icons = {
  clear: SunMoon,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  unknown: CircleHelp,
}

export function ConditionIcon({
  category,
  className = 'size-6',
}: {
  category: ConditionCategory
  className?: string
}) {
  const Icon = icons[category]
  return <Icon aria-hidden="true" className={`text-accent ${className}`} />
}
