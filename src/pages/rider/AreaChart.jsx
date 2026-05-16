import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AreaChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="area" />
        <YAxis />
        <Tooltip />

        <Bar
          dataKey="orders"
          fill="#7c3aed"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AreaChart;
