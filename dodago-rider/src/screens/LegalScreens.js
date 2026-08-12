import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "../components/Primitives";
import { ScreenWithHeader } from "../components/RiderChrome";
import { Mail, Phone } from "../components/Icons";
import { colors } from "../constants/colors";

const featureRows = [
  ["Transparent Pricing", "No hidden charges. Menu prices are same as restaurant dine-in rates."],
  ["Affordable Delivery", "Distance-based delivery fees that are fair and honest."],
  ["Student Partners", "Flexible earning opportunities for students through our delivery network."],
  ["Smart Restaurant Tools", "Advanced tools to help restaurants manage orders efficiently."],
  ["AI-Powered Experience", "Personalized recommendations and smarter order management."],
  ["Local Business Support", "Better platform for local food businesses to grow."],
];

export function AboutScreen({ navigation }) {
  return (
    <ScreenWithHeader title="About" subtitle="Dodago" navigation={navigation}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>About Dodago</Text>
          <Text style={styles.heroTitle}>We Believe Food Delivery Should Be Fair</Text>
          <Text style={styles.heroCopy}>Food delivery was supposed to make life easier. Somewhere along the way, it became expensive, confusing, and unfair for both customers and restaurants. Dodago was created to change that.</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.copy}>We believe ordering food should feel simple, transparent, and accessible without inflated menu prices, hidden charges, or unfair commissions.</Text>
          <Text style={styles.copy}>While traditional platforms often force restaurants to increase prices because of heavy commission fees, Dodago follows a different approach. Instead of taking large cuts on every order, we work on a subscription-based model that helps restaurants keep their prices closer to their actual dine-in rates.</Text>
          <Text style={styles.copy}>That means customers pay more honestly priced bills, and local food businesses get a fairer platform to grow on.</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>More Than Just Delivery</Text>
          <Text style={styles.copy}>Dodago is building a smarter and more community-driven ecosystem.</Text>
          {featureRows.map(([title, body]) => <InfoRow key={title} title={title} body={body} />)}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Our Vision</Text>
          <Text style={styles.copy}>Our vision is to create a platform where technology genuinely improves the food ordering experience instead of making it more complicated. We also want to empower students and young people by creating flexible earning opportunities through our delivery partner network.</Text>
        </Card>

        <View style={styles.beliefBox}>
          <Text style={styles.beliefTitle}>Our Core Belief</Text>
          <Text style={styles.beliefCopy}>Good food should reach people fairly, for customers, restaurants, and delivery partners alike.</Text>
          <Text style={styles.beliefHint}>Dodago - Fair food delivery for everyone</Text>
        </View>
      </ScrollView>
    </ScreenWithHeader>
  );
}

export function ContactUsScreen({ navigation }) {
  const call = (number) => Linking.openURL(`tel:+91${number}`);
  const mail = () => Linking.openURL("mailto:yushpandey3@gmail.com?subject=Dodago%20Support%20Request");

  return (
    <ScreenWithHeader title="Contact Us" subtitle="Dodago" navigation={navigation}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>We are here to help</Text>
          <Text style={styles.heroTitle}>Get in Touch</Text>
          <Text style={styles.heroCopy}>For rider support, account help, delivery issues, privacy requests, or urgent matters, contact Dodago through phone or email.</Text>
        </View>

        <ContactCard icon={Mail} title="Email Us" value="yushpandey3@gmail.com" hint="Tap to open email client" onPress={mail} />
        <ContactCard icon={Phone} title="Call Raushan Pandey" value="+91 9984185916" hint="Primary support and grievance contact" onPress={() => call("9984185916")} />
        <ContactCard icon={Phone} title="Call Yash Chauhan" value="+91 8527879902" hint="Secondary support contact" onPress={() => call("8527879902")} />

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Support Hours</Text>
          <Text style={styles.copy}>Monday - Friday: 9:00 AM - 9:00 PM</Text>
          <Text style={styles.copy}>Saturday - Sunday: 10:00 AM - 6:00 PM</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Grievance Officer</Text>
          <Text style={styles.copy}>Name: Raushanpandey</Text>
          <Text style={styles.copy}>Contact: +91 9984185916</Text>
          <Text style={styles.copy}>Email: yushpandey3@gmail.com</Text>
        </Card>
      </ScrollView>
    </ScreenWithHeader>
  );
}

const privacySections = [
  ["Information We Collect", "We collect account details, phone number, email address, delivery addresses, order details, payment status, support messages, notification tokens, approximate location when permitted, and profile information you choose to provide."],
  ["How We Use Information", "We use data to create accounts, verify OTPs, process orders, deliver food, show order history, provide customer support, send service notifications, prevent abuse, comply with legal duties, and improve Dodago."],
  ["Anti-Fraud & Device Information", "For referral and payment abuse prevention, we may collect a device fingerprint hash, hashed IP address, user-agent, signup time, referral code, and referral voucher activity. Raw IP addresses are not stored for this purpose. These signals are used to detect same-device self-referrals, mass fake accounts, voucher misuse, and suspicious signup patterns."],
  ["Referral Terms", "Referral rewards unlock only when the invited user verifies the account and completes a first paid order. Self-referrals, same-device abuse, fake accounts, duplicate accounts, cancelled orders, refunded orders, or suspicious activity may be rejected or held for review. Referral vouchers are non-transferable, cannot be exchanged for cash, and expire as shown in the app."],
  ["Retention", "We keep personal data only as long as needed for account services, orders, tax/accounting records, dispute handling, fraud prevention, and legal compliance. Device fingerprint and IP hashes used for anti-fraud checks are intended to be retained for a limited period after last activity, normally up to 90 days where operationally feasible, unless needed for security, dispute, or legal reasons."],
  ["Sharing", "We share only what is needed with restaurants, delivery partners, payment processors, cloud/hosting providers, analytics or notification providers, support tools, and legal authorities when required. We do not sell your personal data."],
  ["Cookies & Similar Technologies", "We use cookies, local storage, session storage, and similar technologies for login, cart, OTP flow, referral code capture, app preferences, security, and performance. You can control cookies in your browser, but disabling essential storage may break account or checkout features."],
  ["Your Rights & Account Deletion", "You can request access, correction, update, consent withdrawal, grievance redressal, and deletion of your account data. Some records may be retained where required for tax, fraud prevention, disputes, or legal compliance."],
  ["Grievance Contact", "For privacy requests, account deletion help, or grievances, email yushpandey3@gmail.com or call Grievance Officer Raushanpandey at +91 9984185916, or support contact +91 8527879902. We aim to respond within 30 days. This policy is intended to align with India's Digital Personal Data Protection Act, 2023 and related rules as applicable."],
];

export function PrivacyScreen({ navigation }) {
  return (
    <ScreenWithHeader title="Privacy" subtitle="Dodago" navigation={navigation}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.darkHero}>
          <Text style={styles.heroKicker}>Last updated: July 9, 2026</Text>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroCopy}>Dodago processes personal data for food ordering, delivery, account security, referral fraud prevention, and legal compliance.</Text>
        </View>
        {privacySections.map(([title, body]) => <InfoRow key={title} title={title} body={body} />)}
      </ScrollView>
    </ScreenWithHeader>
  );
}

function InfoRow({ title, body }) {
  return (
    <Card style={styles.infoRow}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.copy}>{body}</Text>
    </Card>
  );
}

function ContactCard({ icon: Icon, title, value, hint, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress}>
      <Card style={styles.contactCard}>
        <View style={styles.contactIcon}><Icon size={22} color={colors.primaryDark} /></View>
        <View style={styles.contactText}>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.contactValue}>{value}</Text>
          <Text style={styles.hint}>{hint}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 138, gap: 14 },
  hero: { borderRadius: 28, backgroundColor: colors.primary, padding: 20, gap: 8 },
  darkHero: { borderRadius: 28, backgroundColor: colors.primaryDark, padding: 20, gap: 8 },
  heroKicker: { color: "#c7d2fe", fontWeight: "900", fontSize: 12, textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 27, lineHeight: 33, fontWeight: "900" },
  heroCopy: { color: "#eef2ff", fontWeight: "700", lineHeight: 22 },
  card: { gap: 10 },
  sectionTitle: { color: colors.primaryDark, fontSize: 20, fontWeight: "900" },
  copy: { color: colors.muted, fontWeight: "700", lineHeight: 22 },
  infoRow: { gap: 8 },
  infoTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  beliefBox: { borderRadius: 24, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: "#c7d2fe", padding: 18, gap: 8 },
  beliefTitle: { color: colors.primaryDark, fontSize: 20, fontWeight: "900", textAlign: "center" },
  beliefCopy: { color: colors.primaryDark, fontSize: 16, lineHeight: 24, fontWeight: "800", textAlign: "center" },
  beliefHint: { color: colors.primary, fontWeight: "900", textAlign: "center" },
  contactCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  contactIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  contactText: { flex: 1, minWidth: 0 },
  contactValue: { color: colors.primaryDark, fontWeight: "900", marginTop: 3 },
  hint: { color: colors.subtle, fontWeight: "800", fontSize: 12, marginTop: 2 },
});


