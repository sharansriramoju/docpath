import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, ExternalLink, MapPin, Plus } from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  SearchBar,
  Select,
  Table,
} from "../components/ui";
import useLocations from "../hooks/useLocations";
import type { TableColumn } from "../components/ui/Table";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

type LocationStatus = "active" | "inactive";

interface Location {
  location_id: string;
  name: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  created_by_id: string;
  created_at: string;
  status: LocationStatus;
}

interface LocationsResponse {
  success: boolean;
  data: {
    count: number;
    rows: Location[];
  };
  message: string;
}

interface LocationByIdResponse {
  success: boolean;
  data: Location;
  message: string;
}

interface SaveLocationResponse {
  success: boolean;
  data: Location;
  message: string;
}

interface LocationFormData {
  name: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  status: LocationStatus;
}

interface LocationRow extends Record<string, unknown>, Location {
  id: string;
}

const EMPTY_FORM: LocationFormData = {
  name: "",
  latitude: "",
  longitude: "",
  google_maps_url: "",
  status: "active",
};

const Locations = () => {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    locations,
    totalCount,
    loading,
    error: loadError,
    loadingLocationId,
    saving,
    saveError,
    fetchLocations,
    fetchLocationById,
    saveLocation,
    setError,
    setSaveError,
    clearErrors,
  } = useLocations();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );

  const [formData, setFormData] = useState<LocationFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<LocationFormData>>({});

  const { showToast } = useToast();

  const canReadLocations = can("read", "Locations");
  const canCreateLocations = can("create", "Locations");
  const canUpdateLocations = can("update", "Locations");

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
    if (!canReadLocations) return;

    const timeoutId = window.setTimeout(() => {
      void fetchLocations(search, page, limit);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canReadLocations, fetchLocations, page, limit, search]);

  const tableRows = useMemo<LocationRow[]>(
    () =>
      locations.map((location) => ({ ...location, id: location.location_id })),
    [locations],
  );

  const validateForm = (): boolean => {
    const nextErrors: Partial<LocationFormData> = {};

    if (!formData.name.trim()) nextErrors.name = "Location name is required";
    if (!formData.latitude.trim()) nextErrors.latitude = "Latitude is required";
    if (!formData.longitude.trim())
      nextErrors.longitude = "Longitude is required";
    if (!formData.google_maps_url.trim())
      nextErrors.google_maps_url = "Google Maps URL is required";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openAddModal = () => {
    if (!canCreateLocations) return;

    setModalMode("add");
    setSelectedLocationId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    clearErrors();
    setModalOpen(true);
  };

  const openEditModal = async (locationId: string) => {
    if (!canUpdateLocations) return;

    clearErrors();
    setFormErrors({});

    try {
      const location = await fetchLocationById(locationId);
      if (!location) {
        setError("Unable to open location details. Please try again.");
        return;
      }

      setModalMode("edit");
      setSelectedLocationId(location.location_id);
      setFormData({
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        google_maps_url: location.google_maps_url,
        status: location.status,
      });
      setModalOpen(true);
    } catch (error) {
      setError("Unable to open location details. Please try again.");
    }
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    clearErrors();
    setSelectedLocationId(null);
  };

  const handleSubmit = async () => {
    if (modalMode === "add" && !canCreateLocations) return;
    if (modalMode === "edit" && !canUpdateLocations) return;
    if (!validateForm()) return;

    clearErrors();

    try {
      if (modalMode === "add") {
        await saveLocation({
          mode: "add",
          data: {
            name: formData.name.trim(),
            latitude: formData.latitude.trim(),
            longitude: formData.longitude.trim(),
            google_maps_url: formData.google_maps_url.trim(),
          },
        });
      } else {
        if (!selectedLocationId) {
          setSaveError("Missing location id for update.");
          return;
        }

        await saveLocation({
          mode: "edit",
          data: {
            location_id: selectedLocationId,
            name: formData.name.trim(),
            latitude: formData.latitude.trim(),
            longitude: formData.longitude.trim(),
            google_maps_url: formData.google_maps_url.trim(),
            status: formData.status,
          },
        });
      }

      closeModal();
      await fetchLocations(search, page, limit);
    } catch (error) {
      setSaveError(
        "Unable to save location. Please check values and try again.",
      );
    }
  };

  const columns: TableColumn<LocationRow>[] = [
    {
      key: "name",
      label: "Location",
      render: (value: unknown) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontWeight: 500,
          }}
        >
          <MapPin size={14} />
          {value as string}
        </span>
      ),
    },
    {
      key: "latitude",
      label: "Latitude",
    },
    {
      key: "longitude",
      label: "Longitude",
    },
    {
      key: "google_maps_url",
      label: "Map URL",
      render: (value: unknown) => (
        <a
          href={value as string}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
            color: "var(--color-primary-600)",
            textDecoration: "none",
          }}
        >
          Open Map <ExternalLink size={13} />
        </a>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => (
        <Badge variant={(value as string) === "active" ? "success" : "default"}>
          {(value as string).charAt(0).toUpperCase() +
            (value as string).slice(1)}
        </Badge>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const subtitle = loading
    ? "Loading locations..."
    : `${tableRows.length} of ${totalCount} location${totalCount !== 1 ? "s" : ""}`;

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle="Manage all location records for scheduling and visits"
        actions={
          canCreateLocations ? (
            <Button icon={Plus} onClick={openAddModal}>
              Add Location
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
              placeholder="Search locations..."
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

        <Table<LocationRow>
          columns={columns}
          data={tableRows}
          emptyMessage={loading ? "Loading locations..." : "No locations found"}
          renderActions={
            canUpdateLocations
              ? (row) => (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => void openEditModal(row.location_id)}
                    disabled={loadingLocationId === row.location_id}
                    title="Edit"
                  />
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
        title={modalMode === "add" ? "Add Location" : "Edit Location"}
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
                  ? "Add Location"
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
            label="Location Name"
            placeholder="Enter location name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            error={formErrors.name}
            disabled={saving}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input
              label="Latitude"
              placeholder="e.g. 24.8607"
              value={formData.latitude}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, latitude: e.target.value }))
              }
              error={formErrors.latitude}
              disabled={saving}
            />
            <Input
              label="Longitude"
              placeholder="e.g. 67.0011"
              value={formData.longitude}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, longitude: e.target.value }))
              }
              error={formErrors.longitude}
              disabled={saving}
            />
          </div>
          <Input
            label="Google Maps URL"
            placeholder="https://maps.google.com/?q=..."
            value={formData.google_maps_url}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                google_maps_url: e.target.value,
              }))
            }
            error={formErrors.google_maps_url}
            disabled={saving}
          />
          {modalMode === "edit" ? (
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as LocationStatus,
                }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              disabled={saving}
            />
          ) : null}

        </div>
      </Modal>
    </div>
  );
};

export default Locations;
