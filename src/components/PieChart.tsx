import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { ChartDataPoint } from '../types';

interface PieChartProps {
  data: ChartDataPoint[];
  chartId: string;
  series?: Array<{
    field: string;
    name: string;
  }>;
}

const PieChart: React.FC<PieChartProps> = ({ data, chartId, series = [] }) => {
  const chartRef = useRef<am5.Root | null>(null);
  const chartDivRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Wait for the next frame to ensure the div is mounted
    const timer = requestAnimationFrame(() => {
      // Cleanup previous root if exists
      if (chartRef.current) {
        chartRef.current.dispose();
      }

      // Check if the div exists
      if (!chartDivRef.current) {
        return;
      }

      // Create root element
      const root = am5.Root.new(chartDivRef.current);

      // Set themes
      root.setThemes([am5themes_Animated.new(root)]);

      // Create chart
      const chart = root.container.children.push(
        am5percent.PieChart.new(root, {
          layout: root.verticalLayout,
          radius: am5.percent(90)
        })
      );

      // Calculate total number of series for radius distribution
      const totalSeries = series.length || 1;

      // Create series for each field
      const chartSeries = (series.length ? series : [{
        field: Object.keys(data[0] || {}).find(key => key !== 'category') || '',
        name: 'Value'
      }]).map((seriesConfig, index) => {
        const colors = [
          0x67B7DC, // blue
          0xDC6967, // coral
          0x84DC67, // emerald
          0x8067DC, // violet
          0xDCAB67, // gold
          0x67DC96, // teal
          0xDC67CE, // rose
          0xA5DC67, // green
          0x6771DC, // purple
          0xDC8C67  // orange
        ];

        // For each subsequent series, decrease outer and inner radius
        const outerRadius = am5.percent(90 - (index * (80 / totalSeries)));
        const innerRadius = am5.percent(45 - (index * (35 / totalSeries)));

        const pieSeries = chart.series.push(
          am5percent.PieSeries.new(root, {
            name: seriesConfig.name,
            valueField: seriesConfig.field,
            categoryField: "category",
            radius: outerRadius,
            innerRadius: innerRadius
          })
        );

        if (series.length <= 1) {
          // For single series, each slice gets its own color
          let currentIndex = 0;
          pieSeries.slices.template.adapters.add("fill", function() {
            return am5.color(colors[currentIndex++ % colors.length]);
          });
        } else {
          // For multiple series, each series gets its own color
          pieSeries.slices.template.setAll({
            fill: am5.color(colors[index % colors.length])
          });
        }

        pieSeries.slices.template.setAll({
          stroke: am5.color(0xffffff),
          strokeWidth: 2,
          fillOpacity: 0.8,
          cornerRadius: 5
        });

        pieSeries.labels.template.setAll({
          text: "{category}: {valuePercentTotal.formatNumber('0.0')}%",
          textType: "circular",
          radius: 10,
          centerX: am5.percent(50),
          centerY: am5.percent(50),
          fill: am5.color(0x000000)
        });

        pieSeries.ticks.template.setAll({
          forceHidden: true
        });

        // Add index to data for coloring
        const dataWithIndex = data.map((item, idx) => ({
          ...item,
          sliceIndex: idx
        }));

        pieSeries.data.setAll(dataWithIndex);
        return pieSeries;
      });

      // Create legend
      const legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        marginTop: 15,
        marginBottom: 15
      }));

      legend.data.setAll(chartSeries);

      // Save root for cleanup
      chartRef.current = root;
    });

    return () => {
      cancelAnimationFrame(timer);
      if (chartRef.current) {
        chartRef.current.dispose();
      }
    };
  }, [data, chartId, series]);

  return (
    <div 
      ref={chartDivRef}
      style={{ 
        width: "100%", 
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0
      }}
    />
  );
};

export default PieChart; 