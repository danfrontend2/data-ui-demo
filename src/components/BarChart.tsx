import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { ChartDataPoint } from '../types';
import { ChartConfig } from '../types';

interface BarChartProps {
  data: ChartDataPoint[];
  chartId: string;
  series: Array<{
    field: string;
    name: string;
  }>;
  chartConfig?: ChartConfig;
}

const BarChart: React.FC<BarChartProps> = ({ data, chartId, series, chartConfig }) => {
  const chartRef = useRef<am5.Root | null>(null);

  useLayoutEffect(() => {
    // Clean up any existing root
    if (chartRef.current) {
      chartRef.current.dispose();
    }

    // Create root element
    const root = am5.Root.new(chartId);

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        layout: root.verticalLayout,
        paddingRight: 20
      })
    );

    // Create axes
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 30
        })
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

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

    const opacity = chartConfig?.opacity ?? 1;

    if (series.length <= 1) {
      // Single series - create separate series for each data point
      data.forEach((item, index) => {
        const field = Object.keys(item).find(key => key !== 'category') || '';
        const value = item[field];
        const color = am5.color(colors[index % colors.length]);

        const barSeries = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name: `${item.category}: ${value}`,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: field,
            categoryXField: "category",
            tooltip: am5.Tooltip.new(root, {
              labelText: "{categoryX}: {valueY}"
            })
          })
        );

        barSeries.columns.template.setAll({
          fillOpacity: opacity,
          fill: color,
          strokeWidth: 0
        });

        // Add hover state
        barSeries.columns.template.states.create("hover", {
          fillOpacity: 0.8
        });

        barSeries.data.setAll([item]);
      });
    } else {
      // Multiple series - create one series per field
      series.forEach((seriesConfig, index) => {
        const color = am5.color(colors[index % colors.length]);

        const barSeries = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name: seriesConfig.name,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: seriesConfig.field,
            categoryXField: "category",
            tooltip: am5.Tooltip.new(root, {
              labelText: `${seriesConfig.name}: {valueY}`
            })
          })
        );

        barSeries.columns.template.setAll({
          fillOpacity: opacity,
          fill: color,
          strokeWidth: 0
        });

        barSeries.data.setAll(data);
      });
    }

    // Create legend
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        useDefaultMarker: true,
        clickTarget: "itemContainer"
      })
    );

    legend.data.setAll(chart.series.values);

    // Set data for X axis
    xAxis.data.setAll(data);

    // Add cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "none",
      xAxis: xAxis,
      yAxis: yAxis
    }));

    // Save root for cleanup
    chartRef.current = root;

    return () => {
      root.dispose();
    };
  }, [chartId, data, series, chartConfig?.opacity]);

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

export default BarChart; 