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

const PieChart: React.FC<PieChartProps> = ({ data, chartId }) => {
  const chartRef = useRef<am5.Root | null>(null);

  useLayoutEffect(() => {
    // Create root element
    const root = am5.Root.new(chartId);

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout
      })
    );

    // Create series
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: Object.keys(data[0]).find(key => key !== 'category') || '',
        categoryField: "category",
        endAngle: 270
      })
    );

    series.states.create("hidden", {
      endAngle: -90
    });

    // Set data
    series.data.setAll(data);

    // Create legend
    const legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50),
      marginTop: 15,
      marginBottom: 15
    }));

    legend.data.setAll(series.dataItems);

    // Save root for cleanup
    chartRef.current = root;

    return () => {
      root.dispose();
    };
  }, [data, chartId]);

  return (
    <div id={chartId} style={{ 
      width: "100%", 
      height: "100%",
      position: "absolute",
      top: 0,
      left: 0
    }}></div>
  );
};

export default PieChart; 