import {
  FiAlertTriangle,
  FiTool,
} from "react-icons/fi";

import useStoreSettings from
  "../../hooks/useStoreSettings";


function MaintenanceNotice() {
  const {
    storeSettings,
  } = useStoreSettings();

  if (
    !storeSettings.maintenance_mode
  ) {
    return null;
  }

  return (
    <section
      className="store-maintenance-notice"
      role="status"
    >
      <div className="container">
        <div className="store-maintenance-notice__icon">
          <FiTool />
        </div>

        <div>
          <strong>
            Store Maintenance
          </strong>

          <p>
            {storeSettings
              .maintenance_message}
          </p>
        </div>

        <FiAlertTriangle />
      </div>
    </section>
  );
}


export default MaintenanceNotice;