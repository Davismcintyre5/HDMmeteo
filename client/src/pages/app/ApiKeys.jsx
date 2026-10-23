import { useEffect, useState } from 'react';
import { Plus, Copy, RotateCw, Trash2, Key, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Table } from '../../components/ui/Table';
import { Toggle } from '../../components/ui/Toggle';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiKeysApi } from '../../api/apiKeys';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../hooks/useToast';
import { formatDate, relativeTime } from '../../utils/format';
import { SCOPES } from '../../utils/constants';

export default function ApiKeys() {
  const toast = useToast();
  const { user } = useAuth();
  const { on } = useSocket();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createScopes, setCreateScopes] = useState(['current', 'forecast']);
  const [creating, setCreating] = useState(false);

  const [revealOpen, setRevealOpen] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [copied, setCopied] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const [rotateTarget, setRotateTarget] = useState(null);
  const [rotating, setRotating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiKeysApi.list();
      setData(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const off = on('apiKey:revoked', () => load());
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keys = data?.keys || [];
  const used = data?.used || 0;
  const max = data?.maxAllowed || 0;
  const unlimited = data?.unlimited === true;
  const atLimit = !unlimited && max > 0 && used >= max;

  function openCreate() {
    setCreateName('');
    setCreateScopes(['current', 'forecast']);
    setCreateOpen(true);
  }

  async function doCreate() {
    if (!createName.trim()) {
      toast.error('Name is required');
      return;
    }
    setCreating(true);
    try {
      const res = await apiKeysApi.create({
        name: createName.trim(),
        scopes: createScopes,
      });
      setCreateOpen(false);
      setRevealed({ plaintext: res.plaintext, name: res.key.name, id: res.key.id });
      setCopied(false);
      setRevealOpen(true);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function doRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await apiKeysApi.revoke(revokeTarget.id);
      toast.success('API key revoked');
      setRevokeTarget(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to revoke');
    } finally {
      setRevoking(false);
    }
  }

  async function doRotate() {
    if (!rotateTarget) return;
    setRotating(true);
    try {
      const res = await apiKeysApi.rotate(rotateTarget.id);
      setRotateTarget(null);
      setRevealed({ plaintext: res.plaintext, name: res.key.name, id: res.key.id });
      setCopied(false);
      setRevealOpen(true);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to rotate');
    } finally {
      setRotating(false);
    }
  }

  async function copyPlaintext() {
    if (!revealed?.plaintext) return;
    try {
      await navigator.clipboard.writeText(revealed.plaintext);
      setCopied(true);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed — select and copy manually');
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{row.name}</p>
          <p className="text-xs text-text-muted">{row.scopes?.join(', ')}</p>
        </div>
      ),
    },
    {
      key: 'masked',
      label: 'Key',
      render: (row) => (
        <code className="text-xs font-mono text-text-muted">{row.masked || `${row.prefix}••••${row.last4}`}</code>
      ),
    },
    {
      key: 'lastUsedAt',
      label: 'Last used',
      render: (row) => (
        <span className="text-xs text-text-muted">
          {row.lastUsedAt ? relativeTime(row.lastUsedAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => <span className="text-xs text-text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'neutral'} size="sm" dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setRotateTarget(row); }}
                title="Rotate"
              >
                <RotateCw size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setRevokeTarget(row); }}
                title="Revoke"
              >
                <Trash2 size={14} className="text-danger" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">API Keys</h1>
          <p className="text-sm text-text-muted mt-1">
            {unlimited ? `${used} active · unlimited` : `${used} of ${max} active`}
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={openCreate}
          disabled={atLimit}
          title={atLimit ? 'Key limit reached' : undefined}
        >
          Create key
        </Button>
      </div>

      {atLimit && (
        <Alert variant="warning" title="Key limit reached">
          You've reached your API key limit ({max}). Revoke an existing key to create a new one.
        </Alert>
      )}

      <Card padding={false}>
        <div className="p-4">
          {loading && !data ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : keys.length === 0 ? (
            <EmptyState
              icon={<Key size={32} />}
              title="No API keys yet"
              description="Create your first key to start making requests."
              action={<Button leftIcon={<Plus size={16} />} onClick={openCreate} disabled={atLimit}>Create key</Button>}
            />
          ) : (
            <Table
              columns={columns}
              data={keys}
              loading={loading}
              rowKey={(r) => r.id || r._id}
            />
          )}
        </div>
      </Card>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create API key"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={doCreate} loading={creating}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Production"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            hint="Helps you identify this key later"
            autoFocus
            maxLength={60}
          />
          <div>
            <p className="text-sm font-medium text-text mb-2">Scopes</p>
            <div className="space-y-2">
              {SCOPES.map((s) => (
                <Toggle
                  key={s.value}
                  label={s.label}
                  checked={createScopes.includes(s.value)}
                  onChange={(checked) => {
                    setCreateScopes((prev) =>
                      checked ? [...prev, s.value] : prev.filter((x) => x !== s.value)
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Reveal modal */}
      <Modal
        open={revealOpen}
        onClose={() => { setRevealOpen(false); setRevealed(null); }}
        title="Your new API key"
        footer={<Button onClick={() => { setRevealOpen(false); setRevealed(null); }}>I've saved it</Button>}
        closeOnBackdrop={false}
        closeOnEsc={false}
      >
        <div className="space-y-4">
          <Alert variant="warning" title="Copy this now">
            You won't be able to see this key again. Store it in a secure location.
          </Alert>
          <div className="rounded-lg bg-surface-2 border border-border p-3">
            <p className="text-xs text-text-muted mb-2">{revealed?.name}</p>
            <code className="text-xs font-mono text-text break-all">{revealed?.plaintext}</code>
          </div>
          <Button
            variant={copied ? 'success' : 'outline'}
            fullWidth
            leftIcon={copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            onClick={copyPlaintext}
          >
            {copied ? 'Copied' : 'Copy to clipboard'}
          </Button>
        </div>
      </Modal>

      {/* Rotate confirm */}
      <Modal
        open={!!rotateTarget}
        onClose={() => setRotateTarget(null)}
        title="Rotate API key"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRotateTarget(null)}>Cancel</Button>
            <Button onClick={doRotate} loading={rotating}>Rotate</Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          This will revoke <strong className="text-text">{rotateTarget?.name}</strong> and issue a new key with the same scopes. Any service using the old key will stop working immediately.
        </p>
      </Modal>

      {/* Revoke confirm */}
      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke API key"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={doRevoke} loading={revoking}>Revoke</Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          Permanently revoke <strong className="text-text">{revokeTarget?.name}</strong>? Any service using this key will stop working immediately.
        </p>
      </Modal>
    </div>
  );
}