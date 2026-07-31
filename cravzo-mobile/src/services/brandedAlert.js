import { Alert as NativeAlert } from "react-native";

const nativeAlert = NativeAlert.alert.bind(NativeAlert);
let presenter = null;

export const showBrandedAlert = (title, message, buttons, options) => {
  if (!presenter) {
    nativeAlert(title, message, buttons, options);
    return;
  }
  presenter({ title, message, buttons, options });
};

export const setBrandedAlertPresenter = (nextPresenter) => {
  presenter = nextPresenter;
  NativeAlert.alert = (title, message, buttons, options) => {
    showBrandedAlert(title, message, buttons, options);
  };

  return () => {
    if (presenter === nextPresenter) presenter = null;
    NativeAlert.alert = nativeAlert;
  };
};
