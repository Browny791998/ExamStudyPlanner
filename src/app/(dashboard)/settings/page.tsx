'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTheme } from 'next-themes'
import { format } from 'date-fns'
import {
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Shield,
  User,
  Palette,
  Sun,
  Moon,
} from 'lucide-react'

import { useAppSelector } from '@/store/hooks'
import { selectUser } from '@/store/slices/authSlice'
import { useSettings, useUpdateProfile, useUpdatePassword } from '@/hooks/useSettings'
import { profileSchema, passwordSchema } from '@/validations/settingsSchema'
import type { ProfileFormData, PasswordFormData } from '@/validations/settingsSchema'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SettingsPage() {
  const { settings, isLoading } = useSettings()
  const { updateProfile, isPending: isProfilePending } = useUpdateProfile()
  const { updatePassword, isPending: isPasswordPending } = useUpdatePassword()
  const user = useAppSelector(selectUser)
  const { theme, setTheme } = useTheme()

  // ── Profile card ────────────────────────────────────────────────────────────
  const [savedProfile, setSavedProfile] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    watch: watchProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: settings?.user.name ?? '' },
  })

  useEffect(() => {
    if (settings?.user.name) {
      resetProfile({ name: settings.user.name })
    }
  }, [settings?.user.name, resetProfile])

  const watchedName = watchProfile('name')
  const isNameUnchanged = watchedName === settings?.user.name

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile(data, {
      onSuccess: () => {
        setSavedProfile(true)
        setTimeout(() => setSavedProfile(false), 3000)
      },
    })
  }

  // ── Password card ───────────────────────────────────────────────────────────
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  const pwd = watchPassword('newPassword') ?? ''
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^a-zA-Z0-9]/.test(pwd),
  }
  const score = Object.values(checks).filter(Boolean).length
  const strengthConfig = [
    { label: '', color: '' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' },
  ]

  const onPasswordSubmit = (data: PasswordFormData) => {
    setApiError(null)
    updatePassword(data, {
      onSuccess: () => {
        resetPassword()
      },
      onError: (error: unknown) => {
        if (error instanceof Error) {
          setApiError(error.message)
        } else {
          setApiError('Something went wrong')
        }
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* ── CARD 1: Profile ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-full bg-primary/20 shrink-0"
              style={{ width: 80, height: 80 }}
            >
              <span className="text-3xl font-bold text-primary select-none">
                {(settings?.user.name ?? user?.name ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-base">
                {isLoading ? '…' : (settings?.user.name ?? user?.name ?? '')}
              </p>
              {settings?.user.createdAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Member since{' '}
                  {format(new Date(settings.user.createdAt), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                {...registerProfile('name')}
              />
              {profileErrors.name && (
                <p className="text-xs text-destructive">{profileErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings?.user.email ?? user?.email ?? ''}
                disabled
                className="text-muted-foreground bg-muted cursor-not-allowed"
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <Button
              type="submit"
              disabled={isNameUnchanged || isProfilePending}
              className="w-full sm:w-auto"
            >
              {isProfilePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : savedProfile ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Saved
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── CARD 2: Change Password ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            {/* Current password */}
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  className="pr-10"
                  {...registerPassword('currentPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowCurrent((v) => !v)}
                  tabIndex={-1}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-destructive">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="pr-10"
                  {...registerPassword('newPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordErrors.newPassword.message}
                </p>
              )}

              {/* Strength bar */}
              {pwd.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strengthConfig[score]?.color}`}
                        style={{ width: `${score * 25}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {strengthConfig[score]?.label}
                    </span>
                  </div>

                  {/* Checklist */}
                  <ul className="grid grid-cols-2 gap-1">
                    {[
                      { key: 'length', label: 'At least 8 characters' },
                      { key: 'upper', label: 'One uppercase letter' },
                      { key: 'number', label: 'One number' },
                      { key: 'special', label: 'One special character' },
                    ].map(({ key, label }) => (
                      <li key={key} className="flex items-center gap-1.5 text-xs">
                        {checks[key as keyof typeof checks] ? (
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        <span
                          className={
                            checks[key as keyof typeof checks]
                              ? 'text-muted-foreground'
                              : 'text-muted-foreground/60'
                          }
                        >
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm new password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="pr-10"
                  {...registerPassword('confirmNewPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmNewPassword && (
                <p className="text-xs text-destructive">
                  {passwordErrors.confirmNewPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPasswordPending}
              className="w-full sm:w-auto"
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── CARD 3: Appearance ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Light theme card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={[
                'rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                theme === 'light'
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-border',
              ].join(' ')}
            >
              {/* Preview */}
              <div className="bg-white p-3 space-y-2">
                {/* Fake nav bar */}
                <div className="h-3 w-full rounded bg-gray-200" />
                {/* Fake content lines */}
                <div className="h-2 w-4/5 rounded bg-gray-100" />
                <div className="h-2 w-3/5 rounded bg-gray-100" />
                <div className="h-2 w-2/3 rounded bg-gray-100" />
              </div>
              {/* Label */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-800">Light</span>
                {theme === 'light' && (
                  <Check className="h-3.5 w-3.5 text-primary ml-auto" />
                )}
              </div>
            </button>

            {/* Dark theme card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={[
                'rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                theme === 'dark'
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-border',
              ].join(' ')}
            >
              {/* Preview */}
              <div className="p-3 space-y-2" style={{ backgroundColor: '#1e293b' }}>
                {/* Fake nav bar */}
                <div className="h-3 w-full rounded" style={{ backgroundColor: '#334155' }} />
                {/* Fake content lines */}
                <div className="h-2 w-4/5 rounded" style={{ backgroundColor: '#2d3f55' }} />
                <div className="h-2 w-3/5 rounded" style={{ backgroundColor: '#2d3f55' }} />
                <div className="h-2 w-2/3 rounded" style={{ backgroundColor: '#2d3f55' }} />
              </div>
              {/* Label */}
              <div
                className="flex items-center gap-2 px-3 py-2 border-t"
                style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
              >
                <Moon className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-medium text-slate-200">Dark</span>
                {theme === 'dark' && (
                  <Check className="h-3.5 w-3.5 text-primary ml-auto" />
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
