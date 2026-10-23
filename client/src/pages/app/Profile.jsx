import { useEffect, useState } from 'react';
import { Save, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { profileApi } from '../../api/profile';
import { isValidKenyanPhone, normalizeKenyanPhone, formatKenyanPhoneDisplay } from '../../utils/phone';
import { isPassword } from '../../utils/validation';
import { formatDate } from '../../utils/format';

export default function Profile() {
  const toast = useToast();
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({ fullName: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        phone: user.phone ? formatKenyanPhoneDisplay(user.phone) : '',
      });
    }
  }, [user]);

  async function saveProfile(e) {
    e.preventDefault();
    if (!profile.fullName.trim()) {
      toast.error('Name is required');
      return;
    }
    if (profile.phone && !isValidKenyanPhone(profile.phone)) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }

    setSavingProfile(true);
    try {
      const phone = profile.phone ? normalizeKenyanPhone(profile.phone) : null;
      const res = await profileApi.update({ fullName: profile.fullName.trim(), phone });
      updateUser({ fullName: res.user.fullName, phone: res.user.phone });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Required';
    if (!isPassword(pw.newPassword)) errs.newPassword = 'Min 8 characters';
    if (pw.newPassword !== pw.confirm) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPw(true);
    try {
      await profileApi.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  }

  const initials = (user?.fullName || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text">Profile</h1>
        <p className="text-sm text-text-muted mt-1">Manage your account details.</p>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[var(--brand-accent)] text-white font-bold text-lg flex items-center justify-center">
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold text-text">{user?.fullName}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
            {user?.createdAt && (
              <p className="text-xs text-text-muted mt-1">Member since {formatDate(user.createdAt)}</p>
            )}
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <Input
            label="Full name"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            required
          />
          <Input
            label="Email"
            value={user?.email || ''}
            disabled
            hint="Email cannot be changed"
          />
          <Input
            label="Phone"
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            onBlur={() => {
              const n = normalizeKenyanPhone(profile.phone);
              if (n) setProfile({ ...profile, phone: formatKenyanPhoneDisplay(n) });
            }}
            placeholder="+254 712 345 678"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile} leftIcon={<Save size={16} />}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Change password">
        <form onSubmit={savePassword} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            error={pwErrors.currentPassword}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            error={pwErrors.newPassword}
            hint="At least 8 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            error={pwErrors.confirm}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingPw} leftIcon={<Lock size={16} />}>
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}