import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { ChevronRight, Mail, Phone } from "../components/Icons";

// ─────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────
function Header({ title, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
        <ChevronRight size={20} color={colors.ink} strokeWidth={2.5} style={{ transform:[{ rotate:"180deg" }] }} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }) {
  return <Text style={styles.para}>{children}</Text>;
}

function ContactRow({ icon: Icon, label, value, hint, onPress }) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.contactIcon}>
        <Icon size={20} color={colors.primary} />
      </View>
      <View style={styles.contactText}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
        {hint ? <Text style={styles.contactHint}>{hint}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────
// ABOUT
// ─────────────────────────────────────────────────────────
export function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="About Dodago" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <Text style={styles.heroKicker}>About Us</Text>
          <Text style={styles.heroTitle}>We Believe Food Delivery Should Be Fair</Text>
          <Text style={styles.heroCopy}>
            Food delivery was supposed to make life easier. Somewhere along the way it became expensive,
            confusing, and unfair for both customers and restaurants. Dodago was created to change that.
          </Text>
        </View>

        <Section title="Our Mission">
          <Para>
            We believe ordering food should feel simple, transparent, and accessible — without inflated
            menu prices, hidden charges, or unfair commissions on every order.
          </Para>
          <Para>
            While traditional platforms often force restaurants to increase prices because of heavy
            commission fees, Dodago follows a subscription-based model that helps restaurants keep
            their prices closer to their actual dine-in rates. Customers pay more honestly priced bills,
            and local food businesses get a fairer platform to grow on.
          </Para>
        </Section>

        <Section title="For Restaurant Partners">
          <Para>
            Dodago gives restaurant partners powerful tools to manage orders, update menus, track
            revenue, and communicate with customers — all from one place. Our vendor dashboard and
            partner app are designed to make daily operations smooth and transparent.
          </Para>
          <Para>
            We charge fair platform fees, provide real-time order notifications, and support you with
            dedicated partner assistance so your business can focus on great food.
          </Para>
        </Section>

        <Section title="Our Vision">
          <Para>
            Our vision is to build a platform where technology genuinely improves the food delivery
            experience instead of making it more complicated — for customers, restaurants, and delivery
            partners alike.
          </Para>
        </Section>

        <View style={styles.beliefBox}>
          <Text style={styles.beliefTitle}>Our Core Belief</Text>
          <Text style={styles.beliefCopy}>
            Good food should reach people fairly — for customers, restaurants, and delivery partners alike.
          </Text>
          <Text style={styles.beliefHint}>Dodago — Fair food delivery for everyone</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────
// CONTACT US
// ─────────────────────────────────────────────────────────
export function ContactUsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Contact Us" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <Text style={styles.heroKicker}>We are here to help</Text>
          <Text style={styles.heroTitle}>Get in Touch</Text>
          <Text style={styles.heroCopy}>
            For restaurant partner support, account help, order issues, payout queries, or privacy
            requests, reach us through phone or email.
          </Text>
        </View>

        {/* Contact cards */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          <ContactRow
            icon={Mail}
            label="Email Support"
            value="yushpandey3@gmail.com"
            hint="General support and grievance requests"
            onPress={() => Linking.openURL("mailto:yushpandey3@gmail.com?subject=Dodago%20Vendor%20Support")}
          />
          <View style={styles.divider} />
          <ContactRow
            icon={Phone}
            label="Raushan Pandey"
            value="+91 9984185916"
            hint="Primary support · Mon–Sat 9 AM–9 PM"
            onPress={() => Linking.openURL("tel:+919984185916")}
          />
          <View style={styles.divider} />
          <ContactRow
            icon={Phone}
            label="Yash Chauhan"
            value="+91 8527879902"
            hint="Secondary support · Mon–Sat 10 AM–6 PM"
            onPress={() => Linking.openURL("tel:+918527879902")}
          />
        </View>

        {/* Support hours */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Support Hours</Text>
          <Para>Monday – Friday: 9:00 AM – 9:00 PM</Para>
          <Para>Saturday – Sunday: 10:00 AM – 6:00 PM</Para>
        </View>

        {/* Grievance Officer */}
        <View style={[styles.card, styles.grievanceCard]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryDark }]}>Grievance Officer</Text>
          <Para>As per India's Digital Personal Data Protection Act, 2023, you may submit privacy-related grievances to our designated Grievance Officer.</Para>
          <View style={styles.grievanceDetails}>
            <Text style={styles.grievanceLine}>👤  Name: Raushan Pandey</Text>
            <TouchableOpacity onPress={() => Linking.openURL("tel:+919984185916")}>
              <Text style={styles.grievanceLink}>📞  +91 9984185916</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("mailto:yushpandey3@gmail.com")}>
              <Text style={styles.grievanceLink}>📧  yushpandey3@gmail.com</Text>
            </TouchableOpacity>
            <Text style={styles.grievanceLine}>⏱  Response within 30 days</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────
// PRIVACY POLICY
// ─────────────────────────────────────────────────────────
const privacySections = [
  {
    title: "1. Who We Are",
    body: "Dodago is a food delivery platform operated in India. This Privacy Policy applies to the Dodago Vendor Partner app and explains how we collect, use, store, share, and protect personal data of restaurant partners and their authorised operators.",
  },
  {
    title: "2. Data We Collect",
    body: "We collect your name, email address, mobile number, profile photo, restaurant details (name, address, FSSAI number, cuisine, operating hours), bank account details for payouts, menu items and images, order data, payout records, support messages, device identifiers, notification tokens, and app usage diagnostics.",
  },
  {
    title: "3. Purpose of Processing",
    body: "We use your data to create and manage your vendor account, onboard and verify your restaurant, process and display orders in real time, calculate and transfer payouts, send order alerts and notifications, provide support, prevent fraud and abuse, improve platform reliability, and comply with applicable law.",
  },
  {
    title: "4. Bank and Financial Data",
    body: "Bank account details (account holder name, bank name, account number, IFSC code) are collected solely for the purpose of processing vendor payouts. This data is stored with access controls and encryption in transit. We do not use this data for any purpose other than payout processing.",
  },
  {
    title: "5. Location Data",
    body: "We collect your restaurant's GPS coordinates to display it on the customer map and calculate delivery distances. Location data is not shared with third parties beyond what is required for delivery operations.",
  },
  {
    title: "6. Sharing of Data",
    body: "We share necessary data with payment processors (for payouts), cloud hosting and infrastructure providers, notification service providers, analytics providers, support tools, and government or legal authorities where required by law. We do not sell your personal data to any third party.",
  },
  {
    title: "7. Data Retention",
    body: "We retain your personal data as long as your vendor account is active or as required for order records, tax compliance, payout accounting, dispute resolution, fraud prevention, and legal obligations. You may request account deletion; some records may be retained where law requires.",
  },
  {
    title: "8. Your Rights Under DPDP 2023",
    body: "Under India's Digital Personal Data Protection Act, 2023, you have the right to: access information about how your data is processed; request correction or updating of inaccurate data; request erasure of data no longer required; withdraw consent; nominate another person to exercise rights on your behalf; and file a grievance with our Grievance Officer or the Data Protection Board.",
  },
  {
    title: "9. Security",
    body: "We use HTTPS/TLS for all data in transit, access controls and authentication for backend systems, encrypted storage for sensitive fields, monitoring and alerting for unusual activity, and restricted staff access on a need-to-know basis.",
  },
  {
    title: "10. Cookies and Local Storage",
    body: "The Vendor app stores your authentication token, session preferences, and app settings locally on your device using AsyncStorage. No marketing cookies are placed. Essential storage is required for the app to function.",
  },
  {
    title: "11. Children",
    body: "The Dodago Vendor Partner app is intended for business users who are at least 18 years old. We do not knowingly collect data from minors.",
  },
  {
    title: "12. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or email. Continued use of the app after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "13. Grievance Officer",
    body: "Name: Raushan Pandey\nContact: +91 9984185916\nEmail: yushpandey3@gmail.com\nAlternate: +91 8527879902 (Yash Chauhan)\n\nYou may submit grievances related to personal data processing. We aim to respond within 30 days of receipt as required under the Digital Personal Data Protection Act, 2023.",
  },
];

export function PrivacyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.hero, { backgroundColor: colors.primaryDark }]}>
          <Text style={styles.heroKicker}>Last updated: 30 August 2026</Text>
          <Text style={styles.heroTitle}>Privacy Policy</Text>
          <Text style={styles.heroCopy}>
            This policy explains how Dodago collects, uses, stores, and protects personal data of
            restaurant partners under India's Digital Personal Data Protection Act, 2023.
          </Text>
        </View>

        {privacySections.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.para}>{s.body}</Text>
          </View>
        ))}

        {/* Grievance box highlighted */}
        <View style={[styles.card, styles.grievanceCard]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryDark }]}>Grievance Officer (Quick Reference)</Text>
          <View style={styles.grievanceDetails}>
            <Text style={styles.grievanceLine}>👤  Raushan Pandey</Text>
            <TouchableOpacity onPress={() => Linking.openURL("tel:+919984185916")}>
              <Text style={styles.grievanceLink}>📞  +91 9984185916</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("mailto:yushpandey3@gmail.com")}>
              <Text style={styles.grievanceLink}>📧  yushpandey3@gmail.com</Text>
            </TouchableOpacity>
            <Text style={styles.grievanceLine}>⏱  Response within 30 days</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { padding: 16, paddingBottom: 40, gap: 14 },

  header:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.line },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontSize: 18, fontWeight: "900", color: colors.ink },

  hero:         { borderRadius: 24, backgroundColor: colors.primary, padding: 20, gap: 8 },
  heroKicker:   { color: "#c7d2fe", fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  heroTitle:    { color: "#fff", fontSize: 24, fontWeight: "900", lineHeight: 30 },
  heroCopy:     { color: "#eef2ff", fontWeight: "700", lineHeight: 21, fontSize: 13 },

  card:         { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 10, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "900", color: colors.ink },
  section:      { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 8, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  para:         { fontSize: 13, color: colors.muted, fontWeight: "700", lineHeight: 21 },
  divider:      { height: 1, backgroundColor: colors.line },

  contactRow:   { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 8 },
  contactIcon:  { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  contactText:  { flex: 1 },
  contactLabel: { fontSize: 13, fontWeight: "900", color: colors.ink },
  contactValue: { fontSize: 14, fontWeight: "900", color: colors.primary, marginTop: 2 },
  contactHint:  { fontSize: 11, color: colors.subtle, fontWeight: "700", marginTop: 1 },

  grievanceCard:    { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  grievanceDetails: { gap: 6, marginTop: 4 },
  grievanceLine:    { fontSize: 13, fontWeight: "800", color: colors.primaryDark },
  grievanceLink:    { fontSize: 13, fontWeight: "900", color: colors.primary, textDecorationLine: "underline" },

  beliefBox:    { borderRadius: 22, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: "#c7d2fe", padding: 18, gap: 8, alignItems: "center" },
  beliefTitle:  { fontSize: 18, fontWeight: "900", color: colors.primaryDark, textAlign: "center" },
  beliefCopy:   { fontSize: 14, color: colors.primaryDark, fontWeight: "800", lineHeight: 22, textAlign: "center" },
  beliefHint:   { fontSize: 13, color: colors.primary, fontWeight: "900", textAlign: "center" },
});
