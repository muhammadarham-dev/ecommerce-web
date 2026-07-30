import {
  useContext,
} from "react";

import EmailNotificationContext from
  "../context/EmailNotificationContext";


function useEmailNotifications() {
  const context = useContext(
    EmailNotificationContext,
  );

  if (!context) {
    throw new Error(
      "useEmailNotifications must be used "
      + "inside EmailNotificationProvider.",
    );
  }

  return context;
}


export default useEmailNotifications;