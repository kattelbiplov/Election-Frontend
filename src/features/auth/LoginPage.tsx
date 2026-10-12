import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Vote } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { useAuth } from './useAuth'
import { useAuthStore } from '../../store/authStore'
import { getApiErrorMessage } from '../../lib/api/client'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    try {
      await signIn(values.email, values.password)
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="flex min-h-dvh w-full bg-card">
      {/* Brand panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-sidebar px-12 py-10 text-white lg:flex xl:w-[40%]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #E80020 0, transparent 45%), radial-gradient(circle at 80% 70%, #E80020 0, transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-brand text-white">
            <Vote className="size-5" />
          </span>
          <span className="text-[16px] font-semibold">Election Ops</span>
        </div>

        <div className="relative">
          <h1 className="text-[30px] font-semibold leading-tight text-white xl:text-[34px]">
            Run your ground game<br />from one command center.
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-white/60">
            Manage wards, toles, and field teams across your entire campaign — with role-based
            access built for how Nepali local elections actually operate.
          </p>

          <ul className="mt-8 flex flex-col gap-3.5">
            {[
              'Nepal’s official province → district → municipality → ward hierarchy',
              'Granular, geography-scoped role permissions',
              'Full audit trail on every change',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-white/75">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12.5px] text-white/40">© {new Date().getFullYear()} Election Ops Platform</p>
      </div>

      {/* Form panel */}
      <div className="safe-top safe-bottom flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <span className="flex size-9 items-center justify-center rounded-md bg-brand text-white">
            <Vote className="size-5" />
          </span>
          <span className="text-[16px] font-semibold text-text">Election Ops</span>
        </div>

        <div className="w-full max-w-[380px]">
          <h2 className="text-[22px] font-semibold text-text">Sign in</h2>
          <p className="mt-1.5 text-[13.5px] text-text-secondary">
            Enter your organization credentials to continue.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-4" noValidate>
            {formError && (
              <div className="rounded-md border border-danger/20 bg-danger-bg px-3.5 py-2.5 text-[13px] text-danger">
                {formError}
              </div>
            )}

            <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@campaign.org"
                leftIcon={<Mail className="size-4" />}
                error={!!errors.email}
                {...register('email')}
              />
            </FormField>

            <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••"
                leftIcon={<LockKeyhole className="size-4" />}
                error={!!errors.password}
                rightSlot={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="focus-ring rounded p-0.5 hover:text-text"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
                {...register('password')}
              />
            </FormField>

            <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-[12.5px] text-text-secondary">
            Accounts are provisioned by your campaign admin — there&apos;s no self-service signup.
          </p>
        </div>
      </div>
    </div>
  )
}
