import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { LoginPage } from '../LoginPage'

const mockLogin = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

function renderPage() {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderPage()
    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))
    expect(await screen.findByText('Adresse email invalide')).toBeInTheDocument()
    expect(screen.getByText('Le mot de passe est requis')).toBeInTheDocument()
  })

  it('shows email validation error for invalid email', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Adresse email'), 'not-an-email')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))
    expect(await screen.findByText('Adresse email invalide')).toBeInTheDocument()
  })

  it('calls login on valid form submission', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Adresse email'), 'test@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('shows server error on login failure', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Email ou mot de passe incorrect.' } },
    })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Adresse email'), 'wrong@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))
    expect(await screen.findByText('Email ou mot de passe incorrect.')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderPage()
    const passwordInput = screen.getByLabelText('Mot de passe')
    expect(passwordInput).toHaveAttribute('type', 'password')
    const toggleButton = screen.getByRole('button', { name: '' })
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('has a link to register page', () => {
    renderPage()
    const link = screen.getByText('Créer un compte')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/register')
  })
})
