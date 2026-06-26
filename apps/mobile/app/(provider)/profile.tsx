import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, formatKES } from "@localfind/shared";
import type { Service } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import Button from "../../components/Button";

export default function ProviderProfile() {
  const provider = useAppStore((s) => s.currentProvider);
  const updateCurrentProvider = useAppStore((s) => s.updateCurrentProvider);

  const [name, setName] = useState(provider.name);
  const [bio, setBio] = useState(provider.bio);
  const [category, setCategory] = useState(provider.category);
  const [subcategory, setSubcategory] = useState(provider.subcategory);
  const [services, setServices] = useState<Service[]>(provider.services);
  const [photos, setPhotos] = useState<string[]>(provider.photos);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = () => {
    updateCurrentProvider({ name, bio, category, subcategory, services });
    setSavedMessage("Profile saved");
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const addService = () => {
    setServices((prev) => [...prev, { name: "New service", price: 0 }]);
  };

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const updateService = (index: number, patch: Partial<Service>) => {
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addPhoto = () => {
    setPhotos((prev) => [...prev, `placeholder-${prev.length + 1}`]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Business Profile</Text>

        <View
          style={[
            styles.verificationBanner,
            { backgroundColor: provider.verified ? "#E5F6EF" : "#FBF3E7" },
          ]}
        >
          <Ionicons
            name={provider.verified ? "checkmark-circle" : "time-outline"}
            size={18}
            color={provider.verified ? COLORS.successGreen : COLORS.warningAmber}
          />
          <Text
            style={[
              styles.verificationText,
              { color: provider.verified ? COLORS.successGreen : COLORS.warningAmber },
            ]}
          >
            {provider.verified ? "Verified business" : "Verification pending"}
          </Text>
        </View>

        {savedMessage && <Text style={styles.savedToast}>{savedMessage}</Text>}

        <Text style={styles.label}>Business name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio} multiline />

        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} />

        <Text style={styles.label}>Subcategory</Text>
        <TextInput style={styles.input} value={subcategory} onChangeText={setSubcategory} />

        <Text style={styles.sectionTitle}>Services</Text>
        {services.map((service, index) => (
          <View key={`${service.name}-${index}`} style={styles.serviceRow}>
            <TextInput
              style={[styles.input, styles.serviceNameInput]}
              value={service.name}
              onChangeText={(text) => updateService(index, { name: text })}
            />
            <TextInput
              style={[styles.input, styles.servicePriceInput]}
              value={String(service.price)}
              keyboardType="numeric"
              onChangeText={(text) => updateService(index, { price: Number(text) || 0 })}
            />
            <Pressable onPress={() => removeService(index)} style={styles.removeBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.dangerRed} />
            </Pressable>
          </View>
        ))}
        <Pressable onPress={addService} style={styles.addServiceBtn}>
          <Ionicons name="add" size={16} color={COLORS.primaryBlue} />
          <Text style={styles.addServiceText}>Add service</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: provider.lat,
              longitude: provider.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: provider.lat, longitude: provider.lng }} />
          </MapView>
        </View>
        <Button title="Update location" variant="ghost" onPress={() => {}} style={{ marginTop: 10 }} />

        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={`${photo}-${index}`} style={styles.photoTile}>
              <Ionicons name="image-outline" size={24} color={COLORS.mutedText} />
            </View>
          ))}
          <Pressable style={styles.photoTile} onPress={addPhoto}>
            <Ionicons name="add" size={24} color={COLORS.primaryBlue} />
          </Pressable>
        </View>

        <Text style={styles.servicesPreviewLabel}>Services & prices preview</Text>
        {services.map((service, index) => (
          <Text key={`preview-${index}`} style={styles.servicePreviewText}>
            {service.name} — {formatKES(service.price)}
          </Text>
        ))}

        <Button title="Save" onPress={handleSave} style={{ marginTop: 20 }} />

        <Pressable onPress={() => router.push(`/(shared)/provider-profile/${provider.id}`)} style={{ marginTop: 16 }}>
          <Text style={styles.previewLink}>Preview my public profile</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 16,
  },
  verificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  verificationText: {
    fontSize: 13,
    fontWeight: "600",
  },
  savedToast: {
    color: COLORS.successGreen,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.midText,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.darkText,
  },
  textarea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    marginTop: 22,
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  serviceNameInput: {
    flex: 2,
  },
  servicePriceInput: {
    flex: 1,
  },
  removeBtn: {
    padding: 6,
  },
  addServiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addServiceText: {
    color: COLORS.primaryBlue,
    fontWeight: "600",
    fontSize: 13,
  },
  mapWrap: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    flex: 1,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoTile: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  servicesPreviewLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 20,
  },
  servicePreviewText: {
    fontSize: 13,
    color: COLORS.darkText,
    marginTop: 4,
  },
  previewLink: {
    textAlign: "center",
    color: COLORS.primaryBlue,
    fontWeight: "600",
  },
});
