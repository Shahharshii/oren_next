"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { FaFileExcel, FaFileCode, FaSignOutAlt } from "react-icons/fa";
import * as XLSX from "xlsx";
import { MdArrowDropUp, MdArrowDropDown } from "react-icons/md";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Interfaces
interface Metric {
    
  label: string;
  unit: string;
  color: string;
}

interface Metrics {
  [key: string]: Metric;
}

interface Benchmarks {
  [key: string]: number;
}

interface SustainabilityData {
  [year: string]: {
    [metric: string]: number | null;
  };
}

interface ChartDataItem {
  year: string;
  [key: string]: string | number;
}

interface WasteDataItem {
  name: string;
  value: number;
}

interface MetricResponse {
  metrics: Array<{
    year: number;
    carbonEmissions?: number;
    waterUsage?: number;
    wasteDistributed?: number;
    energyConsumption?: number;
  }>;
}

// Constants
const METRICS: Metrics = {
  carbonEmissions: {label: "Carbon Emissions",unit: "tons CO2e",color: "#357588" },
  waterUsage: { label: "Water Usage", unit: "kiloliters", color: "#4CAF50" },
  wasteGenerated: { label: "Waste Generated", unit: "tons", color: "#FF9800" },
  energyConsumption: {label: "Energy Consumption",unit: "MWh",color: "#E91E63",
  },
};

const YEARS: string[] = ["2019", "2020", "2021", "2022", "2023"];

const BENCHMARKS: Benchmarks = {
  carbonEmissions: 75,
  waterUsage: 1200,
  wasteGenerated: 45,
  energyConsumption: 850,
};


const COLORS: string[] = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const Dashboard: React.FC = () => {
  const [sustainabilityData, setSustainabilityData] = useState<SustainabilityData>(
    YEARS.reduce(
      (acc, year) => ({
        ...acc,
        [year]: Object.keys(METRICS).reduce(
          (metrics, metric) => ({
            ...metrics,
            [metric]: null,
          }),
          {}
        ),
      }),
      {}
    )
  );

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState<boolean>(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const router = useRouter();

  const handleInputChange = (year: string, metric: string, value: string): void => {
    setSustainabilityData((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [metric]: value === '' ? null : Number(value),
      },
    }));
  };

  const getChartData = (): ChartDataItem[] => {
    return YEARS.map((year) => ({
      year,
      ...Object.keys(METRICS).reduce(
        (acc, metric) => {
          const value = sustainabilityData[year][metric];
          if (value !== null) {
            return {
              ...acc,
              [metric]: Number(value),
            };
          }
          return acc;
        },
        {} as { [key: string]: number }
      ),
    })).filter(data =>
      Object.keys(data).length > 1
    );
  };

  const exportToExcel = (): void => {
    const ws = XLSX.utils.json_to_sheet(getChartData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sustainability Data");
    XLSX.writeFile(wb, "sustainability_metrics.xlsx");
  };

  const getWasteData = (): WasteDataItem[] => {
    return YEARS.map((year) => ({
      name: year,
      value: Number(sustainabilityData[year].wasteGenerated) || 0,
    })).filter((item) => item.value > 0);
  };

  const exportToJSON = (): void => {
    const data = getChartData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sustainability_metrics.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const isFormComplete = (): boolean => {
    return YEARS.every(year =>
      Object.keys(METRICS).every(metric =>
        sustainabilityData[year][metric] !== null &&
        sustainabilityData[year][metric] !== undefined
      )
    );
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    if (!isFormComplete()) {
      toast.error('Please fill in all metrics for all years before submitting.');
      return;
    }

    try {
      const formattedData = getChartData();
      const response = await fetch(`/api/metric/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (response.status === 201) {
        toast.success("Data submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("Failed to submit data. Please try again.");
    }
  };

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
    console.log("Logging out...");
  };

  useEffect(() => {
    const fetchMetricData = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/metric/get`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const { metrics } = await response.json() as MetricResponse;
          const formattedData: SustainabilityData = {};

          YEARS.forEach(year => {
            formattedData[year] = {
              carbonEmissions: null,
              waterUsage: null,
              wasteGenerated: null,
              energyConsumption: null
            };
          });

          metrics.forEach(item => {
            const year = String(item.year);
            if (YEARS.includes(year)) {
              formattedData[year] = {
                carbonEmissions: item.carbonEmissions !== undefined ? Number(item.carbonEmissions) : null,
                waterUsage: item.waterUsage !== undefined ? Number(item.waterUsage) : null,
                wasteGenerated: item.wasteDistributed !== undefined ? Number(item.wasteDistributed) : null,
                energyConsumption: item.energyConsumption !== undefined ? Number(item.energyConsumption) : null
              };
            }
          });

          setSustainabilityData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching metric data:", error);
      }
    };

    fetchMetricData();
  }, []);

  useEffect(() => {
    setIsSmallScreen(window.innerWidth < 1024);
    
    const handleResize = (): void => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // The JSX return remains largely the same, just with proper type annotations
  return (
    // ... previous code remains the same ...
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div
        ref={dashboardRef}
        className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 bg-white print:p-0"
      >
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 sm:mb-6 hide-in-print">
            <div className="flex items-center gap-4">
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[#357588]">
                Sustainability Dashboard
              </h1>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-[#357588] text-white rounded-md hover:bg-[#2c6274] transition-colors duration-200"
              >
                {showForm ? "Hide Form" : "Show Form"}
              </button>
            </div>
            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={exportToJSON}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-[#357588] text-white rounded-md hover:bg-[#2c6274] text-xs sm:text-sm md:text-base transition-colors duration-200"
              >
                <FaFileCode className="text-xs sm:text-sm md:text-base" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs sm:text-sm md:text-base transition-colors duration-200"
              >
                <FaFileExcel className="text-xs sm:text-sm md:text-base" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs sm:text-sm md:text-base transition-colors duration-200"
              >
                <FaSignOutAlt className="text-xs sm:text-sm md:text-base" />
                <span>Logout</span>
              </button>
            </div>
          </div>
  
          {/* Data Input Form */}
          {showForm && (
            <div>
              <div className="hide-in-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                {YEARS.map((year) => (
                  <div key={year} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Year {year}
                    </h3>
                    {Object.entries(METRICS).map(
                      ([metric, { label, unit }]) => (
                        <div key={metric} className="mb-2 sm:mb-3">
                          <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                            {label} ({unit})
                          </label>
                          <input
                            type="number"
                            value={sustainabilityData[year][metric] || ''}
                            onChange={(e) =>
                              handleInputChange(year, metric, e.target.value)
                            }
                            className="w-full p-1.5 sm:p-2 border rounded-md focus:ring-[#357588] focus:border-[#357588] text-sm"
                            required={true}
                            placeholder={`Enter ${label.toLowerCase()}`}
                          />
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleSubmit}
                  disabled={!isFormComplete()}
                  className={`px-6 py-2 text-white rounded-md transition-colors duration-200 font-medium ${
                    isFormComplete()
                      ? 'bg-sky-800 hover:bg-[#2c6274]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Submit Data
                </button>
              </div>
            </div>
          )}
  
          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Carbon Emissions Chart */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow min-h-[300px] sm:min-h-[350px]">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-blue-800">
                Carbon Emissions Trends
              </h3>
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="carbonEmissions"
                      stroke={METRICS.carbonEmissions.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
  
            {/* Water Usage Chart */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow min-h-[300px] sm:min-h-[350px]">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-blue-800">
                Water Usage Analysis
              </h3>
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="waterUsage"
                      stroke={METRICS.waterUsage.color}
                      fill={METRICS.waterUsage.color + "80"}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
  
            {/* Waste Distribution Chart */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow min-h-[300px] sm:min-h-[350px]">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-blue-800">
                Waste Distribution by Year
              </h3>
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getWasteData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) =>
                        `${name}: ${value}${METRICS.wasteGenerated.unit}`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getWasteData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
  
            {/* Energy Consumption Chart */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow min-h-[300px] sm:min-h-[350px]">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-blue-800">
                Energy Consumption Overview
              </h3>
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="10%"
                    outerRadius="80%"
                    data={getChartData().map((item, index) => ({
                      name: item.year,
                      value: item.energyConsumption,
                      fill: COLORS[index % COLORS.length],
                    }))}
                  >
                    <RadialBar
                      label={{ position: "insideStart", fill: "#fff" }}
                      background
                      dataKey="value"
                    />
                    <Legend />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
  
          {/* Industry Benchmark Comparison */}
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              Industry Benchmark Comparison
            </h2>
            <div className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(METRICS).map(([metric, { label }]) => ({
                    name: label,
                    Current: Number(sustainabilityData["2023"][metric]) || 0,
                    Benchmark: BENCHMARKS[metric],
                    Performance:
                      (((Number(sustainabilityData["2023"][metric]) || 0) /
                        BENCHMARKS[metric]) *
                        100).toFixed(1) + "%",
                  }))}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: isSmallScreen ? 70 : 20
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={isSmallScreen ? 10 : 0}
                            textAnchor={isSmallScreen ? "end" : "middle"}
                            transform={isSmallScreen ? "rotate(-45)" : "rotate(0)"}
                            fontSize={isSmallScreen ? 10 : 14}
                          >
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                    interval={0}
                    height={isSmallScreen ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: isSmallScreen ? 10 : 14 }} />
                  <Tooltip />
                  <Legend
                    wrapperStyle={{
                      fontSize: isSmallScreen ? 10 : 14,
                      paddingTop: isSmallScreen ? '20px' : '10px'
                    }}
                  />
                  <Bar
                    dataKey="Current"
                    fill="#357588"
                    name="Your Performance"
                  />
                  <Bar
                    dataKey="Benchmark"
                    fill="#82ca9d"
                    name="Industry Benchmark"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
  
            {/* Performance Summary */}
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {Object.entries(METRICS).map(([metric, { label, }]) => {
                const currentValue =
                  Number(sustainabilityData["2023"][metric]) || 0;
                const benchmark = BENCHMARKS[metric];
                const performance = ((currentValue / benchmark) * 100).toFixed(1);
                const isHigher = Number(performance) > 100;
  
                return (
                  <div
                    key={metric}
                    className="bg-gray-50 p-3 sm:p-4 rounded-lg"
                  >
                    <h4 className="font-medium text-xs sm:text-sm">{label}</h4>
                    <div className="flex items-center">
                      <p
                        className={`text-base sm:text-lg font-bold ${
                          isHigher ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {performance}%
                      </p>
                      {isHigher ? (
                        <MdArrowDropUp className="text-red-500 text-2xl" />
                      ) : (
                        <MdArrowDropDown className="text-green-500 text-2xl" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      of industry benchmark
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default Dashboard;
