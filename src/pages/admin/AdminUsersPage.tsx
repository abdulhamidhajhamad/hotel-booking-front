import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminUsersApi, type AdminUserInput } from '@/api/admin/users';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Button } from '@/components/ui/Button';
import { Alert, ErrorAlert } from '@/components/ui/Feedback';
import { SelectInput, TextInput } from '@/components/ui/Field';
import { dateTime } from '@/lib/format';

const emptyUser: AdminUserInput = { email: '', userName: '', password: '', role: 'Admin' };

export function AdminUsersPage() {
  const [form, setForm] = useState<AdminUserInput>(emptyUser);

  const create = useMutation({
    mutationFn: () => adminUsersApi.create({ ...form, email: form.email.trim(), userName: form.userName.trim() }),
    onSuccess: () => setForm(emptyUser),
  });

  const patch = (changes: Partial<AdminUserInput>) => setForm((current) => ({ ...current, ...changes }));

  return (
    <div className="stack">
      <AdminToolbar title="Users" />

      <Alert tone="info">
        The API exposes creating users only — there is no endpoint that lists or edits them. Accounts created here
        skip email confirmation and can sign in right away.
      </Alert>

      <form
        className="card"
        style={{ maxWidth: 480 }}
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <div className="card-body stack">
          <h2>Create user</h2>

          <TextInput
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(event) => patch({ email: event.target.value })}
          />

          <TextInput
            label="Username"
            required
            minLength={3}
            maxLength={32}
            value={form.userName}
            onChange={(event) => patch({ userName: event.target.value })}
          />

          <TextInput
            label="Password"
            type="password"
            required
            minLength={8}
            value={form.password}
            hint="At least 8 characters with an uppercase letter, a lowercase letter and a digit."
            onChange={(event) => patch({ password: event.target.value })}
          />

          <SelectInput
            label="Role"
            value={form.role}
            onChange={(event) => patch({ role: event.target.value as AdminUserInput['role'] })}
          >
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </SelectInput>

          {create.isSuccess && (
            <Alert tone="success">
              Created {create.data.userName} ({create.data.role}) on {dateTime(create.data.createdAt)}.
            </Alert>
          )}

          <ErrorAlert error={create.error} fallback="Could not create the user." />

          <Button type="submit" variant="primary" loading={create.isPending}>
            Create user
          </Button>
        </div>
      </form>
    </div>
  );
}
