import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Shield, ShieldCheck, Trash2, X } from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  MultiSelectCheckbox,
  SearchBar,
  Select,
  Table,
} from "../components/ui";
import type { TableColumn } from "../components/ui/Table";
import useRoles from "../hooks/useRoles";
import type { PermissionScope } from "../slices/RolesSlice";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const SCOPE_OPTIONS = [
  { value: "LIMITED", label: "Limited" },
  { value: "ALL", label: "All" },
];

interface FormPermission {
  permission_id: string;
  label: string;
  scope: PermissionScope;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: FormPermission[];
}

interface RoleRow extends Record<string, unknown> {
  id: number;
  role_id: number;
  name: string;
  description: string;
  permissionCount: number;
  permissionSubjects: string[];
  created_at: string;
}

const EMPTY_FORM: RoleFormData = {
  name: "",
  description: "",
  permissions: [],
};

// null scope (e.g. "manage all") is treated as ALL for display/editing.
const normalizeScope = (scope: PermissionScope | null): PermissionScope =>
  scope === "LIMITED" ? "LIMITED" : "ALL";

const permissionLabel = (action: string, subject: string) =>
  `${action} · ${subject}`;

const Roles = () => {
  const { can } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    roles,
    totalCount,
    loading,
    error: loadError,
    loadingRoleId,
    saving,
    saveError,
    deletingRoleId,
    permissions,
    fetchRoles,
    fetchRoleById,
    fetchPermissions,
    saveRole,
    deleteRole,
    setError,
    setSaveError,
    clearErrors,
  } = useRoles();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
  }>({});
  // Original permission scopes captured on edit, used to compute the update diff.
  const [originalPermissions, setOriginalPermissions] = useState<
    Map<string, PermissionScope>
  >(new Map());

  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);

  const canReadRoles = can("read", "Roles");
  const canCreateRoles = can("create", "Roles");
  const canUpdateRoles = can("update", "Roles");
  const canDeleteRoles = can("delete", "Roles");

  useEffect(() => {
    if (!loadError) return;
    showToast(loadError, "error");
    setError("");
  }, [loadError]);

  useEffect(() => {
    if (!saveError) return;
    showToast(saveError, "error");
    setSaveError("");
  }, [saveError]);

  useEffect(() => {
    if (!canReadRoles) return;

    const timeoutId = window.setTimeout(() => {
      void fetchRoles(search, page, limit);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canReadRoles, fetchRoles, page, limit, search]);

  const tableRows = useMemo<RoleRow[]>(
    () =>
      roles.map((role: any) => ({
        id: role.role_id,
        role_id: role.role_id,
        name: role.name,
        description: role.description,
        permissionCount: role.permissions.length,
        permissionSubjects: role.permissions.map((p: any) =>
          permissionLabel(p.action, p.subject),
        ),
        created_at: role.created_at,
      })),
    [roles],
  );

  const permissionOptions = useMemo(
    () =>
      permissions.map((p: any) => ({
        value: p.permission_id,
        label: permissionLabel(p.action, p.subject),
      })),
    [permissions],
  );

  const debouncedPermissionSearch = useCallback(
    (value: string) => {
      void fetchPermissions(value);
    },
    [fetchPermissions],
  );

  const validateForm = (): boolean => {
    const nextErrors: { name?: string; description?: string } = {};
    if (!formData.name.trim()) nextErrors.name = "Role name is required";
    if (!formData.description.trim())
      nextErrors.description = "Description is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openAddModal = async () => {
    if (!canCreateRoles) return;

    setModalMode("add");
    setSelectedRoleId(null);
    setFormData(EMPTY_FORM);
    setOriginalPermissions(new Map());
    setFormErrors({});
    clearErrors();
    setModalOpen(true);
    await fetchPermissions("");
  };

  const openEditModal = async (roleId: number) => {
    if (!canUpdateRoles) return;

    clearErrors();
    setFormErrors({});

    try {
      const [role] = await Promise.all([
        fetchRoleById(roleId),
        fetchPermissions(""),
      ]);
      if (!role) {
        setError("Unable to open role details. Please try again.");
        return;
      }

      const original = new Map<string, PermissionScope>();
      const formPermissions: FormPermission[] = role.permissions.map((p) => {
        const scope = normalizeScope(p.RolePermission?.scope ?? null);
        original.set(p.permission_id, scope);
        return {
          permission_id: p.permission_id,
          label: permissionLabel(p.action, p.subject),
          scope,
        };
      });

      setModalMode("edit");
      setSelectedRoleId(role.role_id);
      setOriginalPermissions(original);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: formPermissions,
      });
      setModalOpen(true);
    } catch (error) {
      setError("Unable to open role details. Please try again.");
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setOriginalPermissions(new Map());
    setFormErrors({});
    clearErrors();
    setSelectedRoleId(null);
  };

  const handlePermissionSelectionChange = (selectedIds: string[]) => {
    setFormData((prev) => {
      const existing = new Map(
        prev.permissions.map((p) => [p.permission_id, p]),
      );
      const next: FormPermission[] = selectedIds.map((id) => {
        const already = existing.get(id);
        if (already) return already;
        const option = permissionOptions.find((o: any) => o.value === id);
        return {
          permission_id: id,
          label: option?.label ?? id,
          scope: "LIMITED" as PermissionScope,
        };
      });
      return { ...prev, permissions: next };
    });
  };

  const updatePermissionScope = (id: string, scope: PermissionScope) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) =>
        p.permission_id === id ? { ...p, scope } : p,
      ),
    }));
  };

  const removePermission = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.filter((p) => p.permission_id !== id),
    }));
  };

  const handleSubmit = async () => {
    if (modalMode === "add" && !canCreateRoles) return;
    if (modalMode === "edit" && !canUpdateRoles) return;
    if (!validateForm()) return;

    clearErrors();

    try {
      if (modalMode === "add") {
        await saveRole({
          mode: "add",
          data: {
            name: formData.name.trim(),
            description: formData.description.trim(),
            permissions: formData.permissions.map((p) => ({
              permission_id: p.permission_id,
              scope: p.scope,
            })),
          },
        });
      } else {
        if (!selectedRoleId) {
          setSaveError("Missing role id for update.");
          return;
        }

        const currentIds = new Set(
          formData.permissions.map((p) => p.permission_id),
        );

        const add_permissions = formData.permissions
          .filter((p) => !originalPermissions.has(p.permission_id))
          .map((p) => ({ permission_id: p.permission_id, scope: p.scope }));

        const remove_permissions = Array.from(
          originalPermissions.keys(),
        ).filter((id) => !currentIds.has(id));

        const edit_permissions = formData.permissions
          .filter(
            (p) =>
              originalPermissions.has(p.permission_id) &&
              originalPermissions.get(p.permission_id) !== p.scope,
          )
          .map((p) => ({ permission_id: p.permission_id, scope: p.scope }));

        await saveRole({
          mode: "edit",
          roleId: selectedRoleId,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim(),
            add_permissions,
            remove_permissions,
            edit_permissions,
          },
        });
      }

      showToast(
        modalMode === "add"
          ? "Role created successfully"
          : "Role updated successfully",
        "success",
      );
      closeModal();
      await fetchRoles(search, page, limit);
    } catch (error) {
      // saveError toast handled via effect
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !canDeleteRoles) return;
    try {
      await deleteRole(deleteTarget.role_id);
      showToast("Role deleted successfully", "success");
      setDeleteTarget(null);
      const nextPage = tableRows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await fetchRoles(search, nextPage, limit);
    } catch (error) {
      // error toast handled via effect
    }
  };

  const selectedPermissionIds = formData.permissions.map(
    (p) => p.permission_id,
  );

  const columns: TableColumn<RoleRow>[] = [
    {
      key: "name",
      label: "Role",
      render: (value: unknown) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontWeight: 500,
          }}
        >
          <ShieldCheck size={14} />
          {value as string}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (value: unknown) => (
        <span style={{ color: "var(--text-muted)" }}>
          {(value as string) || "—"}
        </span>
      ),
    },
    {
      key: "permissionCount",
      label: "Permissions",
      render: (value: unknown, row) => {
        const count = value as number;
        if (count === 0) return <Badge variant="default">None</Badge>;
        return (
          <span
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              gap: "var(--space-1)",
              alignItems: "center",
            }}
            title={row.permissionSubjects.join(", ")}
          >
            <Badge variant="primary">
              {count} permission{count !== 1 ? "s" : ""}
            </Badge>
          </span>
        );
      },
    },
  ];

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const subtitle = loading
    ? "Loading roles..."
    : `${tableRows.length} of ${totalCount} role${totalCount !== 1 ? "s" : ""}`;

  return (
    <div>
      <PageHeader
        title="Roles Management"
        subtitle="Define roles and assign permissions for system access control"
        actions={
          canCreateRoles ? (
            <Button icon={Plus} onClick={() => void openAddModal()}>
              Add Role
            </Button>
          ) : null
        }
      />

      <Card>
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <SearchBar
              value={search}
              onChange={(value) => {
                setPage(1);
                setSearch(value);
              }}
              placeholder="Search roles..."
            />
            <Select
              label="Page size"
              value={String(limit)}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              options={[
                { value: "10", label: "10 per page" },
                { value: "25", label: "25 per page" },
                { value: "50", label: "50 per page" },
              ]}
            />
          </div>
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-muted)",
            }}
          >
            {subtitle}
          </span>
        </div>

        <Table<RoleRow>
          columns={columns}
          data={tableRows}
          emptyMessage={loading ? "Loading roles..." : "No roles found"}
          renderActions={
            canUpdateRoles || canDeleteRoles
              ? (row) => (
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    {canUpdateRoles ? (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        onClick={() => void openEditModal(row.role_id)}
                        disabled={loadingRoleId === row.role_id}
                        title="Edit"
                      />
                    ) : null}
                    {canDeleteRoles ? (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setDeleteTarget(row)}
                        disabled={deletingRoleId === row.role_id}
                        title="Delete"
                      />
                    ) : null}
                  </div>
                )
              : undefined
          }
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--space-4) var(--space-5)",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-muted)",
            }}
          >
            Page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={modalMode === "add" ? "Add Role" : "Edit Role"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving
                ? modalMode === "add"
                  ? "Adding..."
                  : "Saving..."
                : modalMode === "add"
                  ? "Add Role"
                  : "Save Changes"}
            </Button>
          </>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <Input
            label="Role Name"
            placeholder="e.g. Compounder"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            error={formErrors.name}
            disabled={saving}
          />
          <Input
            label="Description"
            textarea
            placeholder="Describe what this role can do"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            error={formErrors.description}
            disabled={saving}
          />

          <MultiSelectCheckbox
            label="Permissions"
            placeholder="Select permissions"
            options={permissionOptions}
            value={selectedPermissionIds}
            onChange={handlePermissionSelectionChange}
            onSearch={debouncedPermissionSearch}
            disabled={saving}
          />

          {formData.permissions.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--text-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <Shield size={14} />
                Assigned permissions & scope
              </span>
              {formData.permissions.map((permission) => (
                <div
                  key={permission.permission_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) var(--space-3)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <span style={{ fontSize: "var(--font-size-sm)" }}>
                    {permission.label}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                    }}
                  >
                    <Select
                      value={permission.scope}
                      onChange={(e) =>
                        updatePermissionScope(
                          permission.permission_id,
                          e.target.value as PermissionScope,
                        )
                      }
                      options={SCOPE_OPTIONS}
                      disabled={saving}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={X}
                      onClick={() => removePermission(permission.permission_id)}
                      disabled={saving}
                      title="Remove permission"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Role"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deletingRoleId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              disabled={deletingRoleId !== null}
            >
              {deletingRoleId !== null ? "Deleting..." : "Delete Role"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete the role{" "}
          <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Roles;
