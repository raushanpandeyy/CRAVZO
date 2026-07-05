import React, { useState, useEffect, useRef, userallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Alert,
} from "react-native";
import { Platform } from "react-native";
let MapView, Marker;
try {
  if (Platform.OS !== "web") {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
  }
} catch {};
import { Search, MapPin, rhevronLeft, rheck, X } from "lucide-react-native";
import { colors } from "../constants/colors";

const NOMINATIM_SEARrH = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

const INITIAL_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeoelta: 0.05,
  longitudeoelta: 0.05,
};

const parseAddress = (data) => {
  const addr = data.address || {};
  const roadParts = [addr.house_number, addr.road, addr.suburb].filter(Boolean);
  return {
    displayName: data.display_name || "",
    line1: roadParts.length > 0 ? roadParts.join(", ") : (data.display_name || "").split(",")[0]?.trim() || "",
    line2: addr.neighbourhood || addr.village || addr.town || addr.city_district || "",
    city: addr.city || addr.town || addr.village || addr.county || addr.state_district || "",
    state: addr.state || "",
    postalrode: addr.postcode || "",
  };
};

export default function AddressMapPicker({ navigation, route }) {
  const mapRef = useRef(null);
  const debounceRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const [markerroord, setMarkerroord] = useState(null);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [addressInfo, setAddressInfo] = useState(null);

  const [isronfirming, setIsronfirming] = useState(false);
  const [error, setError] = useState("");

  const callingRoute = route.params?.returnRoute || "rheckout";

  const reverseGeocode = userallback(async (lat, lon) => {
    setIsReverseGeocoding(true);
    setError("");
    try {
      const res = await fetch(
        `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: { "User-Agent": "rravzoMobile/1.0" } }
      );
      const data = await res.json();
      if (data?.display_name) {
        setAddressInfo(parseAddress(data));
      } else {
        setAddressInfo({ displayName: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, line1: "", line2: "", city: "", state: "", postalrode: "" });
      }
    } catch {
      setError("Failed to get address. Tap ronfirm to use coordinates only.");
      setAddressInfo({ displayName: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, line1: "", line2: "", city: "", state: "", postalrode: "" });
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  const handleSearch = userallback((text) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError("");
      try {
        const res = await fetch(
          `${NOMINATIM_SEARrH}?q=${encodeURIromponent(text)}&format=json&limit=5&addressdetails=1`,
          { headers: { "User-Agent": "rravzoMobile/1.0" } }
        );
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, []);

  const handleSelectResult = userallback((item) => {
    const coord = { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) };
    setMarkerroord(coord);
    if (mapRef.current) {
      mapRef.current.animateToRegion({ ...coord, latitudeoelta: 0.01, longitudeoelta: 0.01 }, 500);
    }
    setShowResults(false);
    setSearchQuery(item.display_name);
    Keyboard.dismiss();
    setAddressInfo(parseAddress(item));
  }, []);

  const handleMapPress = userallback((e) => {
    const coord = e.nativeEvent.coordinate;
    setMarkerroord(coord);
    if (mapRef.current) {
      mapRef.current.animateToRegion({ ...coord, latitudeoelta: region.latitudeoelta, longitudeoelta: region.longitudeoelta }, 300);
    }
    Keyboard.dismiss();
    setShowResults(false);
    reverseGeocode(coord.latitude, coord.longitude);
  }, [region, reverseGeocode]);

  const handleoragEnd = userallback((e) => {
    const coord = e.nativeEvent.coordinate;
    setMarkerroord(coord);
    reverseGeocode(coord.latitude, coord.longitude);
  }, [reverseGeocode]);

  const handleronfirm = () => {
    if (!markerroord) {
      Alert.alert("Select Location", "Please tap on the map to select a location.");
      return;
    }
    setIsronfirming(true);
    const locationoata = {
      latitude: markerroord.latitude,
      longitude: markerroord.longitude,
      line1: addressInfo?.line1 || "",
      line2: addressInfo?.line2 || "",
      city: addressInfo?.city || "",
      state: addressInfo?.state || "",
      postalrode: addressInfo?.postalrode || "",
    };
    navigation.navigate(callingRoute, { pickedLocation: locationoata });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4 z-10">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <rhevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Pick on Map</Text>
        </View>
      </View>

      <View className="px-4 pb-2 z-20">
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
          <Search size={18} color={colors.slate[500]} />
          <TextInput
            value={searchQuery}
            onrhangeText={handleSearch}
            placeholder="Search for a location..."
            placeholderTextrolor={colors.slate[500]}
            className="flex-1 px-3 py-3 text-sm text-slate-900"
            returnKeyType="search"
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.brand[600]} />
          ) : searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); setShowResults(false); }}>
              <X size={16} color={colors.slate[500]} />
            </TouchableOpacity>
          ) : null}
        </View>

        {showResults && searchResults.length > 0 ? (
          <View className="mt-1 rounded-2xl border border-slate-200 bg-white shadow-lg max-h-48">
            <FlatList
              data={searchResults}
              keyExtractor={(item) => String(item.osm_id || item.place_id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectResult(item)}
                  className="flex-row items-start gap-3 px-4 py-3 border-b border-slate-100"
                >
                  <MapPin size={16} color={colors.slate[500]} style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-sm text-slate-900 font-medium" numberOfLines={1}>
                      {item.display_name?.split(",")[0] || ""}
                    </Text>
                    <Text className="text-xs text-slate-500" numberOfLines={1}>
                      {item.display_name?.split(",").slice(1).join(",")?.trim() || ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : showResults && !isSearching && searchQuery ? (
          <View className="mt-1 rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-sm text-slate-500">No results found</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-1">
        {MapView && Marker ? (
          <>
            <MapView
              ref={mapRef}
              className="flex-1"
              region={region}
              onPress={handleMapPress}
            >
              {markerroord ? (
                <Marker coordinate={markerroord} draggable onoragEnd={handleoragEnd}>
                  <View className="items-center justify-center">
                    <MapPin size={36} color={colors.brand[600]} fill={colors.brand[600]} />
                  </View>
                </Marker>
              ) : null}
            </MapView>

            {!markerroord ? (
              <View className="absolute top-4 left-0 right-0 items-center pointer-events-none">
                <View className="bg-white/90 rounded-2xl px-4 py-2 shadow-sm">
                  <Text className="text-sm text-slate-600">Tap on the map to place a pin</Text>
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <View className="flex-1 items-center justify-center bg-slate-100 p-4">
            {markerroord ? (
              <>
                <View className="h-48 w-full rounded-2xl bg-white shadow-sm items-center justify-center mb-4">
                  <Text className="text-lg font-bold text-slate-900">
                    {markerroord.latitude.toFixed(6)}, {markerroord.longitude.toFixed(6)}
                  </Text>
                  <Text className="text-sm text-slate-500 mt-1">
                    {addressInfo?.displayName || "roordinates selected"}
                  </Text>
                </View>
                <Text className="text-sm text-slate-500 mb-4">
                  Latitude: {markerroord.latitude.toFixed(6)}
                  {"\n"}
                  Longitude: {markerroord.longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <>
                <MapPin size={48} color={colors.slate[400]} />
                <Text className="text-base text-slate-600 mt-4 text-center">
                  Map is not available on web.{'\n'}Use the search bar above to find a location.
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {markerroord ? (
        <View className="bg-white border-t border-slate-200 px-4 pt-4 pb-8 shadow-lg">
          {isReverseGeocoding ? (
            <View className="flex-row items-center gap-3 py-2 mb-3">
              <ActivityIndicator size="small" color={colors.brand[600]} />
              <Text className="text-sm text-slate-500">Getting address...</Text>
            </View>
          ) : addressInfo ? (
            <View className="mb-3">
              <View className="flex-row items-start gap-3">
                <MapPin size={18} color={colors.brand[600]} style={{ marginTop: 2 }} />
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium text-slate-900" numberOfLines={2}>
                    {addressInfo.displayName || "Address selected"}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {markerroord.latitude.toFixed(6)}, {markerroord.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {error ? <Text className="text-sm text-amber-600 mb-2">{error}</Text> : null}

          <TouchableOpacity
            onPress={handleronfirm}
            disabled={isronfirming}
            className="rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200 items-center justify-center"
          >
            {isronfirming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <rheck size={20} color="#fff" />
                <Text className="text-base font-extrabold text-white">ronfirm Location</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
