import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "../components/Primitives";
import { ScreenWithHeader } from "../components/RiderChrome";
import { Mail, Phone } from "../components/Icons";
import { colors } from "../constants/colors";

const riderBenefitRows = [
  ["Flexible Hours", "You decide when to go online. Deliver on your own schedule — morning, evening, or weekends."],
  ["Fair Earnings", "Distance-based delivery fees with no hidden cuts. What you earn is what you get."],
  ["Real-Time Orders", "Get order requests instantly on your phone. Accept, pick up, and deliver — simple as that."],
  ["Live Delivery Tracking", "Your route is shown clearly on the map. Customers can track you in real time so you spend less time on calls."],
  ["In-App Support", "Run into an issue on a delivery? Chat with Dodago support directly from the app."],
  ["Transparent Payouts", "See a full breakdown of your completed orders and earnings. Payouts go straight to your UPI or bank account."],
];

export function AboutScreen({ navigation }) {
  return (
    <ScreenWithHeader title="About" subtitle="Dodago Rider" navigation={navigation}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>About Dodago Rider</Text>
          <Text style={styles.heroTitle}>Deliver on Your Terms</Text>
          <Text style={styles.heroCopy}>The Dodago Rider app is built for delivery partners who want flexible hours, honest pay, and a platform that actually supports them on the road.</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Who We Are</Text>
          <Text style={styles.copy}>Dodago is a food delivery platform built on the belief that delivery should be fair — for customers, restaurants, and the people who actually do the delivering.</Text>
          <Text style={styles.copy}>Most platforms take large commissions from restaurants, which forces them to raise prices, and they keep riders in the dark about how earnings are calculated. Dodago is different. We work on a subscription model with restaurants, keep our fee structure transparent, and make sure riders know exactly what they earn and why.</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>What the Rider App Does</Text>
          <Text style={styles.copy}>The Dodago Rider app gives you everything you need to manage your deliveries in one place.</Text>
          {riderBenefitRows.map(([title, body]) => <InfoRow key={title} title={title} body={body} />)}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Who Can Join</Text>
          <Text style={styles.copy}>Dodago Rider is open to anyone aged 18 and above who wants to earn through food delivery. Whether you are a student looking for flexible income, or someone who wants to deliver full-time, you are welcome here.</Text>
          <Text style={styles.copy}>You can deliver by cycle or bike. Bike riders will need a valid driving licence and vehicle registration. After you register and verify your email, your account goes through a quick admin review before you can start accepting orders.</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Our Commitment to Riders</Text>
          <Text style={styles.copy}>We believe delivery partners deserve more than just an app to take orders on. Dodago is committed to transparent earnings, fair deduction policies, prompt payout settlements, and responsive support when things go wrong on a delivery.</Text>
          <Text style={styles.copy}>Any deduction from your earnings will always be communicated to you with a clear reason before it is applied. You will never find an unexplained cut in your payout.</Text>
        </Card>

        <View style={styles.beliefBox}>
          <Text style={styles.beliefTitle}>Our Core Belief</Text>
          <Text style={styles.beliefCopy}>Delivery partners are the backbone of every order. They deserve a platform that treats them fairly.</Text>
          <Text style={styles.beliefHint}>Dodago Rider — Deliver fair, earn fair.</Text>
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
          <Text style={styles.copy}>Name: Raushan Pandey</Text>
          <Text style={styles.copy}>Contact: +91 9984185916</Text>
          <Text style={styles.copy}>Email: yushpandey3@gmail.com</Text>
          <Text style={styles.copy}>Alternate: +91 8527879902 (Yash Chauhan)</Text>
          <Text style={styles.copy}>Response within 30 days as per DPDP Act, 2023.</Text>
        </Card>
      </ScrollView>
    </ScreenWithHeader>
  );
}

const privacySections = [
  {
    title: "Who We Are",
    body: "Dodago is a food delivery platform operated in India. This Privacy Policy applies specifically to the Dodago Rider Partner app and explains how we collect, use, store, share, and protect the personal data of delivery partners.",
  },
  {
    title: "Data We Collect",
    body: "When you register and use the Dodago Rider app, we collect:\n\n• Full name, mobile number, and email address\n• City of operation\n• Vehicle type (cycle or bike), vehicle registration number, and driving licence number (for bike riders)\n• Residential address\n• T-shirt/uniform size\n• Password (stored in hashed form — your plain-text password is never stored)\n• Real-time GPS location while you are online or on an active delivery\n• Device identifiers and FCM notification tokens for order alerts\n• Completed order records and earnings history\n• Support messages and complaint records\n• App usage and diagnostic data for performance monitoring",
  },
  {
    title: "How We Use Your Data",
    body: "We use your data to:\n\n• Create and manage your rider account\n• Verify your identity via email OTP during registration\n• Assign nearby delivery orders to you based on your location\n• Show your live position to the assigned customer during an active delivery\n• Calculate delivery distance and estimate arrival time\n• Process and settle your earnings to your payout account\n• Send order notifications and app alerts\n• Provide in-app and phone support\n• Detect and prevent fraudulent account activity\n• Comply with applicable Indian law",
  },
  {
    title: "Location Data",
    body: "When you are marked as online in the app, we collect your real-time GPS location. This is used to assign orders to you and to show your live position to the customer assigned to your active delivery. Location sharing stops when you go offline. We do not track your location when you are offline. Your precise location is never shared with third parties beyond what is required for the active delivery.",
  },
  {
    title: "Notification Tokens",
    body: "We collect your device's FCM (Firebase Cloud Messaging) token to send you order requests, status updates, and important app alerts. You can disable notifications from your device settings, but this will prevent you from receiving order assignments.",
  },
  {
    title: "Anti-Fraud and Account Security",
    body: "To detect duplicate accounts, fake registrations, and fraudulent activity, we may collect a hashed device fingerprint, hashed IP address, user-agent string, and signup timestamp. Raw IP addresses are not stored for this purpose. These signals are used only for security and abuse prevention, not for any commercial profiling.",
  },
  {
    title: "Data Retention",
    body: "We retain your personal data as long as your rider account is active, or as required for:\n\n• Completed order and earnings records\n• Payout accounting and dispute resolution\n• Fraud prevention\n• Tax and legal compliance\n\nDevice fingerprint and IP hashes used for security are retained for up to 90 days after last activity, unless required longer for a dispute or legal matter. You may request account deletion at any time; some records may be retained where law requires.",
  },
  {
    title: "Sharing of Data",
    body: "We share only what is necessary with:\n\n• The customer assigned to your active delivery (your live location during that delivery only)\n• Cloud hosting and infrastructure providers\n• Firebase (for authentication and notifications)\n• Payment processors (for payout settlement)\n• Analytics and monitoring tools (for app performance)\n• Legal or government authorities when required by law\n\nWe do not sell your personal data to any third party.",
  },
  {
    title: "Local Storage",
    body: "The Dodago Rider app stores your authentication token, session preferences, and app settings locally on your device using AsyncStorage. This is required for the app to function. No marketing cookies or tracking technologies are used in the rider app.",
  },
  {
    title: "Children",
    body: "The Dodago Rider app is intended for delivery partners who are at least 18 years old. We do not knowingly collect data from minors.",
  },
  {
    title: "Your Rights Under DPDP Act, 2023",
    body: "Under India's Digital Personal Data Protection Act, 2023, you have the right to:\n\n• Access information about how your personal data is processed\n• Request correction of inaccurate or incomplete data\n• Request erasure of data that is no longer necessary\n• Withdraw consent at any time (this may affect your ability to use the platform)\n• Nominate another person to exercise your rights on your behalf\n• Seek grievance redressal from our Grievance Officer or the Data Protection Board of India\n\nTo exercise any of these rights, contact our Grievance Officer (details below).",
  },
  {
    title: "Grievance Officer",
    body: "Name: Raushan Pandey\nContact: +91 9984185916\nEmail: yushpandey3@gmail.com\nAlternate: +91 8527879902 (Yash Chauhan)\n\nWe aim to respond to all privacy requests and grievances within 30 days as required under the Digital Personal Data Protection Act, 2023.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or email. Continued use of the Dodago Rider app after notification constitutes acceptance of the updated policy.",
  },
];

export function PrivacyScreen({ navigation }) {
  return (
    <ScreenWithHeader title="Privacy Policy" subtitle="Dodago Rider" navigation={navigation}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.darkHero}>
          <Text style={styles.heroKicker}>Last updated: 2 October 2026</Text>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroCopy}>This policy explains how Dodago collects, uses, and protects the personal data of delivery partners using the Dodago Rider app, under India's Digital Personal Data Protection Act, 2023.</Text>
        </View>
        {privacySections.map(({ title, body }) => <InfoRow key={title} title={title} body={body} />)}
        <Card style={[styles.infoRow, { backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#c7d2fe" }]}>
          <Text style={[styles.infoTitle, { color: colors.primaryDark }]}>Grievance Officer (Quick Reference)</Text>
          <Text style={styles.copy}>👤  Raushan Pandey</Text>
          <TouchableOpacity onPress={() => Linking.openURL("tel:+919984185916")}>
            <Text style={[styles.copy, { color: colors.primary, textDecorationLine: "underline", fontWeight: "900" }]}>📞  +91 9984185916</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("mailto:yushpandey3@gmail.com")}>
            <Text style={[styles.copy, { color: colors.primary, textDecorationLine: "underline", fontWeight: "900" }]}>📧  yushpandey3@gmail.com</Text>
          </TouchableOpacity>
          <Text style={styles.copy}>⏱  Response within 30 days</Text>
        </Card>
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




// ─────────────────────────────────────────────────────────
// TERMS AND CONDITIONS — RIDER
// ─────────────────────────────────────────────────────────
const riderTermsSections = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating a Dodago Rider Partner account, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions, our Privacy Policy, and all applicable Indian laws. If you do not agree, do not register or use the platform.",
  },
  {
    title: "2. Eligibility",
    body: "To register as a Dodago delivery partner you must:\n\n• Be at least 18 years of age\n• Hold a valid Indian mobile number and email address\n• If using a bike or motorised vehicle, hold a valid Indian driving licence and vehicle registration\n• Be legally permitted to work as a delivery partner in your city\n\nDodago reserves the right to verify documents and reject or suspend applications that do not meet these requirements.",
  },
  {
    title: "3. Account Registration and Data Collected",
    body: "During registration and use of the platform, we collect:\n\n• Full name, mobile number, and email address\n• City of operation\n• Vehicle type (cycle or bike), vehicle registration number, and driving licence number (for bike riders)\n• Residential address\n• T-shirt size (for uniform/kit issuance)\n• Password (stored in hashed form — we never store your plain-text password)\n• Device identifiers and notification tokens (FCM) for order alerts\n• Real-time GPS location while you are online and on an active delivery\n• Order delivery records, earnings history, and support communications\n• App usage and diagnostic data for performance monitoring\n\nThis data is collected and processed in accordance with our Privacy Policy and India's Digital Personal Data Protection Act, 2023.",
  },
  {
    title: "4. Nature of Engagement",
    body: "You are an independent delivery partner, not an employee of Dodago. Dodago provides a technology platform that connects delivery partners with restaurants and customers. You have the flexibility to choose when you go online and accept deliveries. Dodago does not guarantee a minimum number of orders or minimum earnings.",
  },
  {
    title: "5. Order Acceptance and Delivery",
    body: "Once you accept an order:\n\n• You are responsible for picking up the order from the restaurant promptly\n• You must deliver the order to the customer's address as shown in the app\n• You must not open, tamper with, or consume any part of the order\n• You must treat customers and restaurant staff with respect at all times\n• If you are unable to complete a delivery after accepting, notify Dodago support immediately\n\nRepeated order cancellations after acceptance, without valid reason, may result in account suspension.",
  },
  {
    title: "6. Earnings and Payouts",
    body: "Rider earnings on Dodago work as follows:\n\n• You earn a delivery fee per completed order, calculated based on distance and as communicated in the app\n• Customer payments are processed through Razorpay. Dodago collects the full payment from the customer on your behalf and settles your earnings to your registered payment account on the payout schedule communicated in the app\n• Your payout = total delivery earnings for the settlement period, minus any applicable deductions (see section 7)\n• Payouts are made to your registered UPI ID or bank account. Ensure your payout details are accurate — Dodago is not responsible for failed payouts due to incorrect account information\n• Dodago does not withhold earnings without reason. Any deduction will be communicated to you before being applied\n• If Razorpay holds funds due to suspected fraud or regulatory review, your payout for those orders may be delayed. Dodago will resolve such holds as soon as possible",
  },
  {
    title: "7. Refunds and Deductions",
    body: "Dodago's goal is to ensure riders are paid fairly and that money does not get stuck unnecessarily:\n\n• If a delivery issue is caused by the rider (e.g. wrong address delivered, order tampered with, item lost), the resulting customer refund cost may be partially or fully deducted from the rider's payout\n• If the issue is caused by the restaurant (wrong item packed, missing item), no deduction will be applied to the rider\n• If the issue is caused by factors outside the rider's control (traffic, natural event, customer unavailability), Dodago will assess the case individually and no automatic deduction will be made\n• Riders will be notified of any deduction with a clear reason before it is applied to their payout\n• Riders may appeal a deduction by contacting support within 5 days of notification",
  },
  {
    title: "8. Location Data",
    body: "When you are marked as online in the app, Dodago collects your real-time GPS location. This is used to:\n\n• Assign nearby delivery orders to you\n• Show your live position to the customer during an active delivery (for delivery tracking)\n• Calculate delivery distance and estimated arrival time\n\nLocation collection stops when you go offline. We do not share your precise location with third parties except as needed for the active delivery (visible to the assigned customer only during that delivery).",
  },
  {
    title: "9. Prohibited Conduct",
    body: "Riders must not:\n\n• Create fake or duplicate accounts\n• Accept orders with no intention of completing them\n• Attempt to manipulate the earnings or referral system\n• Share customer or restaurant data obtained through the platform\n• Use the platform under someone else's account\n• Engage in any threatening, abusive, or fraudulent behaviour toward customers, restaurant staff, or Dodago\n\nViolation of these rules will result in immediate account suspension and possible legal action.",
  },
  {
    title: "10. Safety and Insurance",
    body: "You are responsible for your own safety while making deliveries. Dodago strongly recommends that you:\n\n• Always wear a helmet when riding a bike\n• Follow all traffic rules and road safety laws\n• Maintain your vehicle in a roadworthy condition\n\nDodago does not provide accident insurance or health coverage as part of the delivery partner engagement. You are encouraged to obtain personal accidental insurance independently.",
  },
  {
    title: "11. Account Suspension and Termination",
    body: "Dodago may suspend or terminate a rider account for:\n\n• Violation of these Terms\n• Repeated customer complaints\n• Fraudulent activity\n• Providing false documents during registration\n• Extended inactivity\n\nRiders may deactivate their account at any time by contacting support. Any pending earnings will be settled within 30 days of account closure, subject to outstanding disputes.",
  },
  {
    title: "12. Admin Approval",
    body: "After completing registration and OTP verification, your account will be reviewed by the Dodago admin team. You will be able to log in and start accepting deliveries only after your account is approved. Dodago may request additional documents or information during this review. Approval is at Dodago's discretion.",
  },
  {
    title: "13. Limitation of Liability",
    body: "Dodago is a technology platform and is not liable for:\n\n• Accidents, injuries, or damage to property during deliveries\n• Loss of earnings due to platform downtime\n• Actions or omissions of restaurants or customers\n• Payment gateway delays caused by Razorpay or banking partners\n• Force majeure events\n\nOur total liability to a rider in any month shall not exceed the total earnings paid to the rider in that month.",
  },
  {
    title: "14. Governing Law and Dispute Resolution",
    body: "These Terms are governed by the laws of India. Disputes shall first be raised with Dodago support for amicable resolution. If unresolved within 30 days, disputes shall be subject to the jurisdiction of competent courts in India.",
  },
  {
    title: "15. DPDP Act, 2023 — Your Rights",
    body: "Under India's Digital Personal Data Protection Act, 2023, you have the right to:\n\n• Know what personal data is being processed about you\n• Request correction or completion of inaccurate personal data\n• Request erasure of personal data that is no longer necessary\n• Withdraw consent at any time (this may affect your ability to use the platform)\n• Nominate another individual to exercise these rights on your behalf\n• Seek grievance redressal from our Grievance Officer or the Data Protection Board of India\n\nFor any data-related request, contact our Grievance Officer:\nRaushan Pandey | +91 9984185916 | yushpandey3@gmail.com\nWe aim to respond within 30 days.",
  },
  {
    title: "16. Changes to These Terms",
    body: "Dodago may update these Terms from time to time. We will notify you of material changes through the app or email. Continued use of the platform after notification constitutes acceptance of the updated Terms.",
  },
];

export function TermsScreen({ navigation }) {
  return (
    <ScreenWithHeader title="Terms &amp; Conditions" subtitle="Dodago Rider" navigation={navigation}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={[styles.darkHero, { backgroundColor: "#1e1b4b" }]}>
          <Text style={styles.heroKicker}>Last updated: 2 October 2026</Text>
          <Text style={styles.heroTitle}>Terms &amp; Conditions</Text>
          <Text style={styles.heroCopy}>
            These Terms govern your engagement as a Dodago delivery partner. Please read them carefully
            before creating your account.
          </Text>
        </View>

        {riderTermsSections.map(({ title, body }) => (
          <Card key={title} style={styles.infoRow}>
            <Text style={styles.infoTitle}>{title}</Text>
            <Text style={styles.copy}>{body}</Text>
          </Card>
        ))}

        {/* Grievance highlighted box */}
        <Card style={[styles.infoRow, { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" }]}>
          <Text style={[styles.infoTitle, { color: colors.primaryDark }]}>Grievance Officer</Text>
          <Text style={styles.copy}>👤  Raushan Pandey</Text>
          <TouchableOpacity onPress={() => Linking.openURL("tel:+919984185916")}>
            <Text style={[styles.copy, { color: colors.primary, textDecorationLine: "underline", fontWeight: "900" }]}>
              📞  +91 9984185916
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("mailto:yushpandey3@gmail.com")}>
            <Text style={[styles.copy, { color: colors.primary, textDecorationLine: "underline", fontWeight: "900" }]}>
              📧  yushpandey3@gmail.com
            </Text>
          </TouchableOpacity>
          <Text style={styles.copy}>⏱  Response within 30 days</Text>
        </Card>

      </ScrollView>
    </ScreenWithHeader>
  );
}
