import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { RegisterPage } from '../RegisterPage'

const { mockRegister, mockNavigate } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockNavigate: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  authApi: { register: mockRegister },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderPage() {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  )
}

describe('RegisterPage', () => {
  it('renders the registration form', () => {
    renderPage()
    expect(screen.getByText('Créer un compte')).toBeInTheDocument()
    expect(screen.getByText('Civilité *')).toBeInTheDocument()
    expect(screen.getByText('Nom *')).toBeInTheDocument()
    expect(screen.getByText('Prénom *')).toBeInTheDocument()
    expect(screen.getByText('Téléphone *')).toBeInTheDocument()
    expect(screen.getByText('Adresse email *')).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: "Créer mon compte" }))
    expect(await screen.findByText('La civilité est requise')).toBeInTheDocument()
  })

  it('shows password mismatch error', async () => {
    const user = userEvent.setup()
    renderPage()
    const passwordInput = screen.getByLabelText('Mot de passe *')
    const confirmInput = screen.getByLabelText('Confirmation *')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'different')
    await user.click(screen.getByRole('button', { name: "Créer mon compte" }))
    expect(await screen.findByText('Les mots de passe ne correspondent pas')).toBeInTheDocument()
  })

  it('calls register and navigates on success', async () => {
    mockRegister.mockResolvedValueOnce({ data: { data: {} } })
    const user = userEvent.setup()
    renderPage()

    // Fill Radix Select fields
    const [civilityTrigger, sexeTrigger] = screen.getAllByRole('combobox')
    await user.click(civilityTrigger)
    await user.click(screen.getByRole('option', { name: 'M.' }))
    await user.click(sexeTrigger)
    await user.click(screen.getByRole('option', { name: 'Homme' }))

    await user.type(screen.getByLabelText('Nom *'), 'Dupont')
    await user.type(screen.getByLabelText('Prénom *'), 'Jean')
    await user.type(screen.getByLabelText('Téléphone *'), '06123456')
    await user.type(screen.getByLabelText('Adresse email *'), 'test@example.com')

    const passwordInput = screen.getByLabelText('Mot de passe *')
    const confirmInput = screen.getByLabelText('Confirmation *')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')

    await user.click(screen.getByRole('button', { name: "Créer mon compte" }))
    expect(mockRegister).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { registered: true } })
  })

  it('shows server error on registration failure', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'Email déjà utilisé' } },
    })
    const user = userEvent.setup()
    renderPage()

    // Fill Radix Select fields
    const [civilityTrigger, sexeTrigger] = screen.getAllByRole('combobox')
    await user.click(civilityTrigger)
    await user.click(screen.getByRole('option', { name: 'M.' }))
    await user.click(sexeTrigger)
    await user.click(screen.getByRole('option', { name: 'Homme' }))

    await user.type(screen.getByLabelText('Nom *'), 'Dupont')
    await user.type(screen.getByLabelText('Prénom *'), 'Jean')
    await user.type(screen.getByLabelText('Téléphone *'), '06123456')
    await user.type(screen.getByLabelText('Adresse email *'), 'test@example.com')

    const passwordInput = screen.getByLabelText('Mot de passe *')
    const confirmInput = screen.getByLabelText('Confirmation *')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')

    await user.click(screen.getByRole('button', { name: "Créer mon compte" }))
    expect(await screen.findByText('Email déjà utilisé')).toBeInTheDocument()
  })
})
