import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function AssignedServices() {
  const [services, setServices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= LOAD SERVICES ================= */
  const loadServices = async () => {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_staff_email", email)
      .neq("work_status", "COMPLETED");

    setServices(bookings || []);
  };

  /* FIRST LOAD */
  useEffect(() => {
    loadServices();
  }, []);

  /* RELOAD ON FOCUS */
  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, []),
  );

  /* ================= PULL TO REFRESH ================= */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  }, []);

  /* ================= GOOGLE MAPS ================= */
  const openMaps = (lat: number, lng: number) => {
    if (!lat || !lng) {
      Alert.alert("Location coordinates not available");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor="#FFD700" barStyle="dark-content" />

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />

        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* ================= BODY ================= */}
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {services.length === 0 ? (
          <Text style={styles.emptyText}>No Assigned Services</Text>
        ) : (
          services.map((item) => {
            const isActive =
              item.work_started_at &&
              (!item.work_ended_at || item.work_ended_at === null);

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isActive && styles.activeHighlight, // 🔥 highlight active card
                ]}
              >
                {/* 🔥 HEADER ROW */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.cardTitle}>{item.customer_name}</Text>

                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>

                {/* 🔥 RUNNING STATUS */}
                {isActive && (
                  <Text style={styles.runningText}>⏱ Work in progress</Text>
                )}

                <Text>
                  <Text style={styles.label}>Phone:</Text>{" "}
                  {item.phone_number || "N/A"}
                </Text>

                <Text>
                  <Text style={styles.label}>Date:</Text> {item.booking_date}
                </Text>

                <Text>
                  <Text style={styles.label}>Time:</Text> {item.booking_time}
                </Text>

                <Text>
                  <Text style={styles.label}>Address:</Text> {item.full_address}
                </Text>

                <View style={styles.section}>
                  <Text style={styles.label}>Services:</Text>

                  {item.services?.map((s: any, i: number) => (
                    <View key={i} style={styles.serviceItem}>
                      <Text style={styles.serviceName}>• {s.title}</Text>
                      <Text style={styles.serviceMeta}>
                        Duration: {s.duration}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* LOCATION BUTTON */}
                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => openMaps(item.latitude, item.longitude)}
                >
                  <Text style={styles.mapBtnText}>Location</Text>
                </TouchableOpacity>

                {/* 🔥 OPEN / RESUME BUTTON */}
                <TouchableOpacity
                  style={styles.openServiceBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/assigned-service-details",
                      params: { booking: JSON.stringify(item) },
                    })
                  }
                >
                  <Text style={styles.openServiceText}>
                    {isActive ? "Resume Work" : "Open Service"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ================= FOOTER ================= */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/my-role")}
        >
          <Ionicons name="home-outline" size={22} color="#000000" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/dashboard")}
        >
          <Ionicons name="calendar-outline" size={22} color="#000" />
          <Text style={styles.footerText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/my-account")}
        >
          <Ionicons name="person-outline" size={22} color="#000" />
          <Text style={styles.footerText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: {
    height: 72,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    width: 190,
    height: 64,
  },

  body: {
    padding: 20,
    paddingBottom: 90,
  },

  card: {
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
  },

  /* 🔥 ACTIVE CARD HIGHLIGHT */
  activeHighlight: {
    borderColor: "#FFD700",
    backgroundColor: "#fffbea",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },

  activeBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  activeBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },

  runningText: {
    fontWeight: "700",
    marginBottom: 6,
  },

  label: { fontWeight: "700" },

  section: { marginVertical: 10 },

  serviceItem: { marginLeft: 10, marginTop: 6 },

  serviceName: { fontWeight: "700" },

  serviceMeta: {
    marginLeft: 10,
    color: "#555",
    fontSize: 13,
  },

  mapBtn: {
    marginTop: 14,
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  mapBtnText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
  },

  openServiceBtn: {
    marginTop: 8,
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  openServiceText: {
    color: "#080700",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 40,
    color: "#666",
  },

  footer: {
    height: 70,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  footerItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  footerText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
    color: "#000",
  },
});
