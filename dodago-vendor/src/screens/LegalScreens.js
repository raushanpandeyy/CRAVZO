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
          <Text style={styles.heroKicker}>About Dodago Vendor Partner</Text>
          <Text style={styles.heroTitle}>A Platform Built for Restaurant Partners</Text>
          <Text style={styles.heroCopy}>
            The Dodago Vendor Partner app gives your restaurant real-time order management, transparent
            payouts, and direct control over your menu — without the heavy commission cuts of traditional
            platforms.
          </Text>
        </View>

        <Section title="Why Dodago is Different">
          <Para>
            Most food delivery platforms charge restaurants a large commission on every order. To
            protect their margins, restaurants end up raising menu prices — and customers notice.
          </Para>
          <Para>
            Dodago works on a subscription model instead. You pay a fair platform fee, keep your menu
            prices honest, and let the food speak for itself. No surprise commission deductions on every
            single order.
          </Para>
        </Section>

        <Section title="What the Vendor App Does for You">
          <Para>
            The Dodago Vendor Partner app is designed around what a restaurant actually needs day to day:
          </Para>
          <Para>
            • Real-time order notifications — accept, prepare, and hand off orders without missing a beat.
          </Para>
          <Para>
            • Menu management — add items, update prices, toggle availability, and upload food photos
            directly from your phone.
          </Para>
          <Para>
            • Revenue tracking — see your completed orders, earnings, and payout history in one place.
          </Para>
          <Para>
            • Payout transparency — earnings go to your registered bank account on a clear schedule.
            Any deduction comes with a reason, communicated before it is applied.
          </Para>
          <Para>
            • Partner support — reach the Dodago team by phone or email for order issues, payout
            queries, or account help.
          </Para>
        </Section>

        <Section title="Our Commitment to Vendor Partners">
          <Para>
            We believe restaurants deserve a platform that works with them, not against them. That means
            fair fees, honest communication, and tools that actually save time instead of adding
            complexity.
          </Para>
          <Para>
            If there is ever a dispute or a deduction, you will know exactly why. If there is a problem
            with a payout, support is a call away. We are building this platform alongside our restaurant
            partners, and your feedback shapes what we build next.
          </Para>
        </Section>

        <View style={styles.beliefBox}>
          <Text style={styles.beliefTitle}>Our Core Belief</Text>
          <Text style={styles.beliefCopy}>
            Restaurant partners deserve honest fees, clear payouts, and tools that help their business
            grow — not a platform that profits at their expense.
          </Text>
          <Text style={styles.beliefHint}>Dodago Vendor — Partner with confidence.</Text>
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
          <Text style={styles.heroKicker}>Last updated: 2 October 2026</Text>
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


// ─────────────────────────────────────────────────────────
// TERMS AND CONDITIONS
// ─────────────────────────────────────────────────────────
const termsSections = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating a Dodago Vendor Partner account, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions, our Privacy Policy, and all applicable Indian laws. If you do not agree, do not register or use the platform.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old and legally authorised to operate a food business in India to register as a Dodago vendor. By registering, you represent that your restaurant holds all required licences including a valid FSSAI registration.",
  },
  {
    title: "3. Account Registration and Data Collected",
    body: "During registration and use of the platform, we collect:\n\n• Full name and contact details (email, mobile number)\n• Restaurant name, address, and GPS coordinates\n• FSSAI licence number and business documents\n• Bank account details (account holder name, account number, IFSC, bank name) for payout processing\n• Menu items, prices, images, and operating hours\n• Order data, payout records, and support communication\n• Device identifiers and notification tokens\n• App usage and diagnostic data\n\nThis data is processed in accordance with our Privacy Policy and India's Digital Personal Data Protection Act, 2023.",
  },
  {
    title: "4. Platform Fees and Subscription",
    body: "Dodago operates on a subscription-based model. You pay a platform subscription fee as communicated at onboarding and within the app. Subscription fees, once paid, are non-refundable unless stated otherwise at the time of payment.",
  },
  {
    title: "5. Menu Base Price, Platform Markup, and What You Receive",
    body: "Dodago uses a base price and platform markup system. Here is exactly how it works:\n\n• When you add a menu item, you enter your base price — the amount you wish to earn for that item\n• Dodago's platform adds a markup on top of your base price for certain food categories. This markup percentage or amount is set by Dodago and is visible to you in the app before you publish your menu\n• The price the customer sees and pays is your base price plus the platform markup\n• Your payout for each completed order is calculated on your base price only — the markup portion is retained by Dodago as part of the platform revenue structure\n• Dodago will never reduce your base price without your knowledge. The base price you enter is the exact amount you will receive per item sold (subject only to subscription fee share and any refund adjustments per Section 7)\n• You can view the current markup rates for each food category in the app at any time\n• If Dodago changes a markup rate, you will be notified in advance. Your base prices remain unchanged unless you edit them yourself\n\nExample: If your base price is ₹100 and the platform markup for that category is ₹20, the customer pays ₹120. You receive ₹100 per unit sold (minus your subscription fee share for that settlement period).",
  },
  {
    title: "5a. Order Processing and Responsibilities",
    body: "You are responsible for:\n\n• Setting base prices that accurately reflect the amount you wish to earn per item\n• Keeping your menu, item availability, and operating hours updated at all times in the app\n• Preparing and handing over orders accurately and on time\n• Maintaining food hygiene and safety standards as per FSSAI guidelines\n• Notifying Dodago promptly if you are unable to fulfil an accepted order\n\nDodago is not liable for disputes arising from incorrect menu information, unavailable items, or late preparation on the restaurant's part.",
  },
  {
    title: "6. Payments and Payouts",
    body: "Customer payments are processed through Razorpay, a PCI-DSS compliant payment gateway. Dodago does not store raw card or UPI credentials.\n\nVendor payouts work as follows:\n\n• The customer pays the total order amount: sum of (your base price + platform markup) for each item ordered, plus any applicable delivery fee\n• Your payout = sum of your base prices for items in the order, minus your platform subscription fee share for the settlement period, minus any refund adjustments (see Section 7)\n• The platform markup on items and the delivery fee are retained by Dodago and are not part of your payout\n• Payouts are transferred to your registered bank account on the schedule communicated in the app (typically weekly or as agreed)\n• If a customer payment fails, is reversed, or is subject to a chargeback, the corresponding order will not be included in your payout\n• Razorpay may hold funds temporarily in cases of suspected fraud or regulatory review; Dodago is not responsible for delays caused by Razorpay or banking partners\n• Any deduction from your payout will be communicated to you with a clear reason before it is applied\n• Discrepancies in payout amounts must be raised within 7 days of the payout date by contacting support",
  },
  {
    title: "7. Refunds and Disputes",
    body: "Dodago aims to ensure that funds are not unnecessarily held. Our refund policy for vendors:\n\n• If a customer receives a wrong or incomplete order due to the restaurant's error, the customer may be eligible for a refund. The refund amount will be deducted from the vendor's next payout\n• If the delivery partner caused the issue (spilled, delayed, wrong delivery), the refund cost will not be passed to the vendor\n• If a dispute is raised and found to be unsubstantiated, no deduction will be made\n• Dodago will notify the vendor of any refund deduction with reason before applying it\n• Vendors may appeal a refund deduction by contacting support within 5 days",
  },
  {
    title: "8. Cancellations",
    body: "If a vendor cancels an accepted order without a valid reason, it may result in:\n\n• Customer receiving a full refund (deducted from vendor payout)\n• A note on the vendor account; repeated cancellations may lead to temporary suspension\n\nEmergency closures should be communicated in advance by marking the restaurant as temporarily unavailable in the app.",
  },
  {
    title: "9. Prohibited Conduct",
    body: "Vendors must not:\n\n• List items that are illegal, unsafe, or do not comply with FSSAI standards\n• Enter a base price that does not reflect your actual intended earnings — base prices must be genuine\n• Attempt to transact with customers outside the Dodago platform to avoid platform fees\n• Manipulate ratings or reviews\n• Share another party's data obtained through Dodago for any unauthorised purpose\n• Use the platform for any fraudulent activity",
  },
  {
    title: "10. Intellectual Property",
    body: "By uploading menu images, descriptions, and other content to Dodago, you grant Dodago a non-exclusive, royalty-free licence to display that content on the platform for the purpose of showing your restaurant to customers. You retain ownership of your content.",
  },
  {
    title: "11. Suspension and Termination",
    body: "Dodago may suspend or terminate a vendor account for:\n\n• Violation of these Terms\n• Repeated customer complaints or low ratings\n• Failure to maintain FSSAI or other mandatory licences\n• Fraudulent activity or misrepresentation\n\nVendors may close their account at any time by contacting support. Pending payout amounts will be settled within 30 days of account closure, subject to any outstanding disputes.",
  },
  {
    title: "12. Limitation of Liability",
    body: "Dodago is a technology platform connecting restaurants with customers and delivery partners. We are not liable for:\n\n• Loss of business, revenue, or profits arising from platform downtime\n• Actions or omissions of delivery partners\n• Payment gateway delays or failures\n• Force majeure events\n\nOur total liability to a vendor in any month shall not exceed the total platform fees paid by the vendor in that month.",
  },
  {
    title: "13. Governing Law and Dispute Resolution",
    body: "These Terms are governed by the laws of India. Any dispute arising out of or in connection with these Terms shall first be attempted to be resolved amicably by contacting Dodago support. If unresolved within 30 days, disputes shall be subject to the jurisdiction of courts in India.",
  },
  {
    title: "14. DPDP Act, 2023 — Your Rights",
    body: "Under India's Digital Personal Data Protection Act, 2023, you have the right to:\n\n• Know what personal data is being processed about you\n• Request correction or completion of inaccurate personal data\n• Request erasure of personal data that is no longer necessary\n• Withdraw consent at any time (this may affect your ability to use the platform)\n• Nominate another individual to exercise these rights on your behalf\n• Seek grievance redressal from our Grievance Officer or the Data Protection Board of India\n\nFor data requests, contact our Grievance Officer: Raushan Pandey, +91 9984185916, yushpandey3@gmail.com. We aim to respond within 30 days.",
  },
  {
    title: "15. Changes to These Terms",
    body: "Dodago may update these Terms from time to time. We will notify you of material changes through the app or email. Continued use of the platform after notification constitutes acceptance of the updated Terms.",
  },
];

export function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Terms & Conditions" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.hero, { backgroundColor: "#1e1b4b" }]}>
          <Text style={styles.heroKicker}>Last updated: 2 October 2026</Text>
          <Text style={styles.heroTitle}>Terms &amp; Conditions</Text>
          <Text style={styles.heroCopy}>
            These Terms govern your use of the Dodago Vendor Partner platform. Please read them carefully
            before creating your account.
          </Text>
        </View>

        {termsSections.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.para}>{s.body}</Text>
          </View>
        ))}

        {/* Grievance highlighted box */}
        <View style={[styles.card, styles.grievanceCard]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryDark }]}>Grievance Officer</Text>
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
