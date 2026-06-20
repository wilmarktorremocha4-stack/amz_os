"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2, FolderPlus, ChevronDown, ChevronUp } from "lucide-react";
import { updateProfile } from "@/lib/actions/settings";
import {
  createCustomFieldFolder,
  deleteCustomFieldFolder,
  createCustomField,
  deleteCustomField,
} from "@/lib/actions/customFields";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

const FIELD_TYPES = [
  { value: "single_line", label: "Single line" },
  { value: "multi_line", label: "Multi line" },
  { value: "text_box_list", label: "Text box list" },
  { value: "number", label: "Number" },
  { value: "phone", label: "Phone" },
  { value: "monetary", label: "Monetary" },
  { value: "dropdown_single", label: "Dropdown (single)" },
  { value: "dropdown_multi", label: "Dropdown (multiple)" },
  { value: "radio", label: "Radio select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file_upload", label: "File upload" },
  { value: "date_picker", label: "Date picker" },
  { value: "signature", label: "Signature" },
];

type CustomField = { id: string; name: string; type: string; options: string[] | null };
type CustomFieldFolder = { id: string; name: string; fields: CustomField[] };

const SETTINGS_TABS = ["profile", "custom-fields"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

export function SettingsClient({
  user,
  customFieldFolders,
}: {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    nickname: string;
    companyWebsite: string;
    skoolId: string;
    monthlyRevenueGoal: number | null;
  };
  customFieldFolders: CustomFieldFolder[];
}) {
  const [tab, setTab] = useState<SettingsTab>("profile");

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">Manage your profile and workspace.</p>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-1">
        {(["profile", "custom-fields"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}>
            {t === "custom-fields" ? "Custom Fields" : "Profile"}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileForm user={user} />}
      {tab === "custom-fields" && <CustomFieldsManager folders={customFieldFolders} />}
    </main>
  );
}

type ProfileUser = {
  email: string; firstName: string; lastName: string; nickname: string;
  companyWebsite: string; skoolId: string; monthlyRevenueGoal: number | null;
};

function ProfileForm({ user }: { user: ProfileUser }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProfile(fd);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  function handleCancel() {
    setEditing(false);
    setSaved(false);
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex max-w-lg flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Profile</h2>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]">
            Edit
          </button>
        )}
        {saved && !editing && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <Check size={13} /> Saved!
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--muted)]">Email</label>
        <input value={user.email} disabled className="input opacity-60" readOnly />
        <span className="text-xs text-[var(--muted)]">Set at signup — contact support to change it.</span>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-[var(--muted)]">First name</label>
          <input name="firstName" defaultValue={user.firstName} disabled={!editing} className="input disabled:opacity-60" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-[var(--muted)]">Last name</label>
          <input name="lastName" defaultValue={user.lastName} disabled={!editing} className="input disabled:opacity-60" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--muted)]">Nickname</label>
        <input name="nickname" defaultValue={user.nickname} disabled={!editing} className="input disabled:opacity-60"
          placeholder="What should the AI Agent call you?" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--muted)]">Company website</label>
        <input name="companyWebsite" defaultValue={user.companyWebsite} disabled={!editing} className="input disabled:opacity-60"
          placeholder="https://yourcompany.com" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--muted)]">Skool ID</label>
        <input name="skoolId" defaultValue={user.skoolId} disabled={!editing} className="input disabled:opacity-60" placeholder="Optional" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--muted)]">Monthly revenue goal ($)</label>
        <input name="monthlyRevenueGoal" type="number" step="0.01"
          defaultValue={user.monthlyRevenueGoal ?? ""} disabled={!editing} className="input disabled:opacity-60" placeholder="e.g. 5000" />
        <span className="text-xs text-[var(--muted)]">Used by the MRR growth chart on the dashboard.</span>
      </div>

      {editing && (
        <div className="flex items-center gap-2">
          <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={handleCancel}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}

function CustomFieldsManager({ folders }: { folders: CustomFieldFolder[] }) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewField, setShowNewField] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(folders.map((f) => f.id)));
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggleFolder(id: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleCreateFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createCustomFieldFolder(fd);
      setShowNewFolder(false);
    });
  }

  function handleCreateField(e: React.FormEvent<HTMLFormElement>, folderId: string | null) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (folderId) fd.set("folderId", folderId);
    startTransition(async () => {
      await createCustomField(fd);
      setShowNewField(null);
    });
  }

  return (
    <>
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          Create custom fields to capture additional information on your contacts.
        </p>
        <button onClick={() => setShowNewFolder(true)}
          className="btn-primary whitespace-nowrap">
          <FolderPlus size={14} />
          New folder
        </button>
      </div>

      {showNewFolder && (
        <form onSubmit={handleCreateFolder}
          className="flex gap-2 rounded-xl border border-blue-500/30 bg-[var(--surface)] p-3">
          <input name="name" placeholder="Folder name" required className="input flex-1" autoFocus />
          <button type="button" onClick={() => setShowNewFolder(false)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
            Cancel
          </button>
          <button type="submit" className="btn-primary">Create</button>
        </form>
      )}

      {folders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="font-medium text-[var(--foreground)]">No folders yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Create a folder to organize your custom fields.</p>
        </div>
      )}

      {folders.map((folder) => (
        <div key={folder.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[var(--accent-soft)]">
            <button onClick={() => toggleFolder(folder.id)}
              className="flex items-center gap-2 font-medium text-[var(--foreground)] hover:text-blue-500">
              {expandedFolders.has(folder.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {folder.name}
              <span className="text-xs text-[var(--muted)]">({folder.fields.length})</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowNewField(folder.id)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)] hover:text-blue-500">
                <Plus size={12} /> Add field
              </button>
              <button onClick={() => setDeleteFolderId(folder.id)}
                className="rounded-lg p-1 text-[var(--muted)] hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {expandedFolders.has(folder.id) && (
            <div>
              {folder.fields.length === 0 && showNewField !== folder.id && (
                <p className="px-4 py-3 text-xs text-[var(--muted)]">No fields yet. Add one above.</p>
              )}
              {folder.fields.map((field) => (
                <div key={field.id}
                  className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[var(--foreground)]">{field.name}</span>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                      {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
                    </span>
                  </div>
                  <button onClick={() => setDeleteFieldId(field.id)}
                    className="rounded-lg p-1 text-[var(--muted)] hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {showNewField === folder.id && (
                <NewFieldForm
                  onSubmit={(e) => handleCreateField(e, folder.id)}
                  onCancel={() => setShowNewField(null)}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>

    {deleteFolderId && (
      <DeleteConfirmModal
        title={`Delete folder "${folders.find((f) => f.id === deleteFolderId)?.name ?? ""}"?`}
        description={`This will permanently delete the folder and all ${folders.find((f) => f.id === deleteFolderId)?.fields.length ?? 0} field(s) inside it.`}
        onConfirm={() => { startTransition(() => deleteCustomFieldFolder(deleteFolderId)); setDeleteFolderId(null); }}
        onCancel={() => setDeleteFolderId(null)}
      />
    )}

    {deleteFieldId && (
      <DeleteConfirmModal
        title={`Delete field "${folders.flatMap((f) => f.fields).find((f) => f.id === deleteFieldId)?.name ?? ""}"?`}
        description="This custom field and any stored values will be permanently deleted."
        onConfirm={() => { startTransition(() => deleteCustomField(deleteFieldId)); setDeleteFieldId(null); }}
        onCancel={() => setDeleteFieldId(null)}
      />
    )}
    </>
  );
}

function NewFieldForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const [fieldType, setFieldType] = useState("single_line");
  const needsOptions = ["dropdown_single", "dropdown_multi", "radio", "checkbox"].includes(fieldType);

  return (
    <form onSubmit={onSubmit}
      className="border-t border-[var(--border)] bg-[var(--bg)] p-4 flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Field name</label>
          <input name="name" placeholder="e.g. Budget range" required className="input w-full" autoFocus />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Field type</label>
          <select name="type" value={fieldType} onChange={(e) => setFieldType(e.target.value)}
            className="input w-full bg-[var(--surface)]">
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      {needsOptions && (
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
            Options (one per line)
          </label>
          <textarea name="options" rows={3} placeholder={"Option 1\nOption 2\nOption 3"}
            className="input w-full resize-none text-xs" />
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)]">
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
          Create field
        </button>
      </div>
    </form>
  );
}
