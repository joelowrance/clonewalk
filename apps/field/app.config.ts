import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig & { newArchEnabled?: boolean } = {
  name: 'Compliance Field',
  slug: 'compliance-field',
  version: '1.0.0',
  platforms: ['ios', 'android', 'web'],
  newArchEnabled: true,
  web: {
    bundler: 'metro',
    output: 'single',
  },
  plugins: ['expo-router'],
}

export default config
