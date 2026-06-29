import { useState } from 'react'
import { Button } from '../components/ui/button'
import { signIn } from '../lib/auth'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col gap-6 px-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Meridian</h1>
          <p className="text-sm text-muted-foreground">Sign in to plan your week</p>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button onClick={handleSignIn} disabled={loading} size="lg" className="w-full">
          {loading ? 'Signing in…' : 'Continue with Google'}
        </Button>
      </div>
    </div>
  )
}
