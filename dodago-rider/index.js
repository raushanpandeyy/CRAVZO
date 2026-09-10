import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import App from "./App";

// Background task handlers MUST be defined before registerRootComponent so
// the JS runtime can find them when the OS wakes the app in the background.
// This import has a side-effect: calls TaskManager.defineTask() immediately.
import { defineBackgroundLocationTask } from "./src/services/locationTaskService";
defineBackgroundLocationTask();

registerRootComponent(App);
