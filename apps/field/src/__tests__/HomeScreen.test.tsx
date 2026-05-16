import { render, screen } from '@testing-library/react-native'
import HomeScreen from '../../app/(app)/index'

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    render(<HomeScreen />)
    expect(screen.getByText('Field App')).toBeTruthy()
  })
})
