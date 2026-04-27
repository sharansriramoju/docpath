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
import api from "../utils/api";
import type { TableColumn } from "../components/ui/Table";

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
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [loadingLocationId, setLoadingLocationId] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [formData, setFormData] = useState<LocationFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<LocationFormData>>({});

  const fetchLocations = useCallback(async (searchText: string) => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get<LocationsResponse>("/locations", {
        params: {
          search: searchText || undefined,
          page: 1,
          limit: 50,
        },
      });

      setLocations(response.data.data.rows);
    } catch (error) {
      console.error("Failed to load locations", error);
      setLoadError("Unable to load locations. Please try again.");
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLocations(search);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchLocations, search]);

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
    setModalMode("add");
    setSelectedLocationId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setSaveError("");
    setModalOpen(true);
  };

  const openEditModal = async (locationId: string) => {
    setLoadingLocationId(locationId);
    setSaveError("");
    setFormErrors({});

    try {
      const response = await api.get<LocationByIdResponse>(
        `/location/${locationId}`,
      );
      const location = response.data.data;

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
      console.error("Failed to fetch location by id", error);
      setLoadError("Unable to open location details. Please try again.");
    } finally {
      setLoadingLocationId(null);
    }
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setSaveError("");
    setSelectedLocationId(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setSaveError("");

    try {
      if (modalMode === "add") {
        await api.post<SaveLocationResponse>("/location", {
          name: formData.name.trim(),
          latitude: formData.latitude.trim(),
          longitude: formData.longitude.trim(),
          google_maps_url: formData.google_maps_url.trim(),
        });
      } else {
        if (!selectedLocationId) {
          setSaveError("Missing location id for update.");
          return;
        }

        await api.put<SaveLocationResponse>("/location", {
          location_id: selectedLocationId,
          name: formData.name.trim(),
          latitude: formData.latitude.trim(),
          longitude: formData.longitude.trim(),
          google_maps_url: formData.google_maps_url.trim(),
          status: formData.status,
        });
      }

      closeModal();
      await fetchLocations(search);
    } catch (error) {
      console.error("Failed to save location", error);
      setSaveError(
        "Unable to save location. Please check values and try again.",
      );
    } finally {
      setSaving(false);
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

  const subtitle = loading
    ? "Loading locations..."
    : `${tableRows.length} location${tableRows.length !== 1 ? "s" : ""}`;

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle="Manage all location records for scheduling and visits"
        actions={
          <Button icon={Plus} onClick={openAddModal}>
            Add Location
          </Button>
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
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search locations..."
          />
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-muted)",
            }}
          >
            {subtitle}
          </span>
        </div>

        {loadError ? (
          <div
            style={{
              padding: "0 var(--space-5) var(--space-4)",
              color: "var(--color-danger-700)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            {loadError}
          </div>
        ) : null}

        <Table<LocationRow>
          columns={columns}
          data={tableRows}
          emptyMessage={loading ? "Loading locations..." : "No locations found"}
          renderActions={(row) => (
            <Button
              variant="outline"
              size="sm"
              icon={Edit2}
              onClick={() => void openEditModal(row.location_id)}
              disabled={loadingLocationId === row.location_id}
              title="Edit"
            />
          )}
        />
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

          {saveError ? (
            <div
              style={{
                color: "var(--color-danger-700)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              {saveError}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default Locations;
