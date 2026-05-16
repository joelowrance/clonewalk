import { render } from '@testing-library/react-native'
import RootLayout from '../../app/_layout'

jest.mock('expo-router', () => ({
  Stack: jest.fn(() => null),
}))

describe('RootLayout', () => {
  it('renders a Stack navigator', () => {
    render(<RootLayout />)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Stack } = require('expo-router') as { Stack: jest.Mock }
    expect(Stack).toHaveBeenCalled()
  })
})
