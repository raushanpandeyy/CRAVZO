import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-[#F4F7FB] px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <Text className="text-3xl">⚠️</Text>
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 mb-2">Oops!</Text>
          <Text className="text-center text-slate-600 mb-6 leading-5">
            Something went wrong. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            className="rounded-2xl bg-indigo-950 px-8 py-3 shadow-lg shadow-indigo-950/20"
          >
            <Text className="text-sm font-bold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
