export const START = Date.UTC(2026, 8, 30, 12) / 1000

export function forecastFixture() {
  return {
    timezone: 'Africa/Lagos',
    current: {
      time: START,
      interval: 900,
      temperature_2m: 29,
      apparent_temperature: 31,
      relative_humidity_2m: 68,
      precipitation: 0,
      weather_code: 2,
      wind_speed_10m: 12,
      wind_direction_10m: 225,
      wind_gusts_10m: 18,
      surface_pressure: 960,
    },
    hourly: {
      time: Array.from({ length: 24 }, (_, i) => START + i * 3600),
      temperature_2m: Array.from({ length: 24 }, (_, i) => 24 + (i % 8)),
      relative_humidity_2m: Array(24).fill(68) as number[],
      precipitation_probability: Array(24).fill(20) as number[],
      precipitation: Array(24).fill(0) as number[],
      wind_speed_10m: Array(24).fill(12) as number[],
      weather_code: Array(24).fill(2) as number[],
    },
    daily: {
      time: Array.from(
        { length: 7 },
        (_, i) => Date.UTC(2026, 8, 29, 23) / 1000 + i * 86400,
      ),
      temperature_2m_max: Array(7).fill(32) as number[],
      temperature_2m_min: Array(7).fill(23) as number[],
      weather_code: Array(7).fill(2) as number[],
      precipitation_probability_max: Array(7).fill(30) as number[],
      precipitation_sum: Array(7).fill(0) as number[],
      wind_speed_10m_max: Array(7).fill(18) as number[],
      sunrise: Array.from(
        { length: 7 },
        (_, i) => Date.UTC(2026, 8, 30, 5) / 1000 + i * 86400,
      ),
      sunset: Array.from(
        { length: 7 },
        (_, i) => Date.UTC(2026, 8, 30, 17) / 1000 + i * 86400,
      ),
    },
  }
}

export const locationFixture = {
  results: [
    {
      id: 1850147,
      name: 'Tokyo',
      country: 'Japan',
      admin1: 'Tokyo',
      latitude: 35.6895,
      longitude: 139.6917,
      timezone: 'Asia/Tokyo',
    },
  ],
}
