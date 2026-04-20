import { PageHeader } from "../components/layout";
import { Card, Button, Input, Select } from "../components/ui";

const Settings = () => (
  <div>
    <PageHeader
      title="Settings"
      subtitle="Clinic configuration and preferences"
    />

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
        maxWidth: 640,
      }}
    >
      <Card>
        <Card.Header title="Clinic Information" />
        <Card.Body>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <Input
              label="Clinic Name"
              defaultValue="ClinicCare — Dr. Rajesh Sharma"
              name="clinicName"
            />
            <Input
              label="Address"
              textarea
              defaultValue="Main Road, Near Bus Stand, Mandi, HP 175001"
              name="address"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <Input label="Phone" defaultValue="01905-234567" name="phone" />
              <Input
                label="Email"
                defaultValue="clinic@clinicare.com"
                name="email"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Appointment Settings" />
        <Card.Body>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <Select
              label="Default Slot Duration"
              options={[
                { value: "15", label: "15 Minutes" },
                { value: "20", label: "20 Minutes" },
                { value: "30", label: "30 Minutes" },
              ]}
              defaultValue="20"
              name="slotDuration"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <Input
                label="OPD Start Time"
                type="time"
                defaultValue="09:00"
                name="opdStart"
              />
              <Input
                label="OPD End Time"
                type="time"
                defaultValue="17:00"
                name="opdEnd"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Town Visit Defaults" />
        <Card.Body>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <Input
              label="Default Medicines to Carry"
              textarea
              placeholder="List default medicines for town visits..."
              name="defaultMeds"
            />
            <Input
              label="Default Equipment"
              textarea
              placeholder="List default equipment..."
              name="defaultEquip"
            />
          </div>
        </Card.Body>
      </Card>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "var(--space-3)",
        }}
      >
        <Button variant="secondary">Reset</Button>
        <Button>Save Settings</Button>
      </div>
    </div>
  </div>
);

export default Settings;
