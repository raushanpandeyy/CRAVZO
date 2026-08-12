import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

const iconProps = ({ size = 20, color = "#0f172a", fill = "none" }) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill,
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const Home = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="M3 10.8 12 3l9 7.8" />
    <Path d="M5 10v10h14V10" />
    <Path d="M9.5 20v-6h5v6" />
  </Svg>
);

export const ClipboardList = (props) => (
  <Svg {...iconProps(props)}>
    <Rect x="8" y="3" width="8" height="4" rx="2" />
    <Path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
    <Line x1="8" y1="11" x2="16" y2="11" />
    <Line x1="8" y1="15" x2="16" y2="15" />
  </Svg>
);

export const MessageCircle = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L4 20l.9-4.6A8.5 8.5 0 1 1 21 11.5Z" />
  </Svg>
);

export const User = (props) => (
  <Svg {...iconProps(props)}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);

export const Bike = (props) => (
  <Svg {...iconProps(props)}>
    <Circle cx="5.5" cy="17.5" r="3.5" />
    <Circle cx="18.5" cy="17.5" r="3.5" />
    <Path d="M8.5 17.5h3.5l3-6h-4" />
    <Path d="M12 17.5 8.5 10H6" />
    <Path d="M15 11.5h2.5l1 6" />
    <Path d="M14 7h3" />
  </Svg>
);

export const LogOut = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="M10 17l5-5-5-5" />
    <Path d="M15 12H3" />
    <Path d="M21 4v16" />
  </Svg>
);

export const Mail = (props) => (
  <Svg {...iconProps(props)}>
    <Rect x="3" y="5" width="18" height="14" rx="2" />
    <Path d="m3 7 9 6 9-6" />
  </Svg>
);

export const Phone = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="M22 16.9v2.6a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.7 19.7 0 0 1 2.1 3.8 2 2 0 0 1 4.1 1.6h2.6a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.8 9.3a16 16 0 0 0 6.9 6.9l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.3 1.6Z" />
  </Svg>
);

export const MapPin = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const Power = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="M12 2v10" />
    <Path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
  </Svg>
);

export const BatteryWarning = (props) => (
  <Svg {...iconProps(props)}>
    <Rect x="2" y="7" width="18" height="10" rx="2" />
    <Path d="M22 11v2" />
    <Path d="M11 9v4" />
    <Path d="M11 15h.01" />
  </Svg>
);

export const PackageCheck = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="m21 8-9-5-9 5 9 5 9-5Z" />
    <Path d="M3 8v8l9 5 9-5V8" />
    <Path d="m9 16 2 2 4-5" />
  </Svg>
);

export const Navigation = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="M3 11 21 3l-8 18-2-8-8-2Z" />
  </Svg>
);

export const Send = (props) => (
  <Svg {...iconProps(props)}>
    <Path d="M22 2 11 13" />
    <Path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </Svg>
);

export const Star = ({ size = 20, color = "#0f172a", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z" />
  </Svg>
);

export const X = (props) => (
  <Svg {...iconProps(props)}>
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
