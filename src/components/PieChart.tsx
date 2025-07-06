import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { ChartDataPoint } from '../types';
import { ChartConfig } from '../types';

interface PieChartProps {
  data: ChartDataPoint[];
  chartId: string;
  series: Array<{
    field: string;
    name: string;
  }>;
  chartConfig?: ChartConfig;
}

const PieChart: React.FC<PieChartProps> = ({ data, chartId, series, chartConfig }) => {
  const chartRef = useRef<am5.Root | null>(null);

  useLayoutEffect(() => {
    if (chartRef.current) {
      chartRef.current.dispose();
    }

    const root = am5.Root.new(chartId);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: 0
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

    // Helper function to get stroke color (make it darker)
    const getStrokeColor = (baseColor: number): am5.Color => {
      // Extract RGB components and make them darker
      const r = ((baseColor >> 16) & 0xFF) * 0.6; // Reduce red by 40%
      const g = ((baseColor >> 8) & 0xFF) * 0.6;  // Reduce green by 40%
      const b = (baseColor & 0xFF) * 0.6;         // Reduce blue by 40%
      // Combine back into RGB color
      const darkerColor = (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b);
      return am5.color(darkerColor);
    };

    if (series.length <= 1) {
      // Single series - create one series with individual colors
      const field = Object.keys(data[0]).find(key => key !== 'category') || '';
      const pieSeries = chart.series.push(
        am5percent.PieSeries.new(root, {
          categoryField: "category",
          valueField: field,
          legendLabelText: "[{fill}]{category}[/]: {value}",
          legendValueText: ""
        })
      );

      // Prepare data with colors
      const coloredData = data.map((item, index) => {
        const fillColor = colors[index % colors.length];
        return {
          ...item,
          sliceSettings: {
            fill: am5.color(fillColor),
            stroke: getStrokeColor(fillColor)
          }
        };
      });

      // Set colors for individual slices
      pieSeries.slices.template.setAll({
        strokeWidth: chartConfig?.strokeWidth ?? 2,
        fillOpacity: chartConfig?.opacity ?? 1,
        templateField: "sliceSettings"
      });

      // Add hover state
      pieSeries.slices.template.states.create("hover", {
        scale: 1.05,
        fillOpacity: 0.8
      });

      // Add click behavior
      pieSeries.slices.template.set("toggleKey", "active");
      pieSeries.slices.template.states.create("hidden", {
        fillOpacity: 0.15,
        stroke: getStrokeColor(colors[0]),
        strokeWidth: chartConfig?.strokeWidth ?? 2
      });

      pieSeries.data.setAll(coloredData);

      // Create legend
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          useDefaultMarker: true,
          clickTarget: "itemContainer"
        })
      );

      legend.data.setAll(pieSeries.dataItems);

    } else {
      // Multiple series - create separate series for each field
      series.forEach((seriesConfig, index) => {
        const fillColor = colors[index % colors.length];
        const pieSeries = chart.series.push(
          am5percent.PieSeries.new(root, {
            name: seriesConfig.name,
            categoryField: "category",
            valueField: seriesConfig.field,
            legendLabelText: "[{fill}]{category}[/]: {value}",
            legendValueText: "",
            fill: am5.color(fillColor)
          })
        );

        pieSeries.slices.template.setAll({
          strokeWidth: chartConfig?.strokeWidth ?? 2,
          fillOpacity: chartConfig?.opacity ?? 1,
          fill: am5.color(fillColor),
          stroke: getStrokeColor(fillColor)
        });

        pieSeries.data.setAll(data);
      });

      // Create legend
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          useDefaultMarker: true,
          clickTarget: "itemContainer"
        })
      );

      // Configure legend markers
      legend.markers.template.setAll({
        width: 16,
        height: 16
      });

      legend.markerRectangles.template.setAll({
        cornerRadiusTL: 0,
        cornerRadiusTR: 0,
        cornerRadiusBL: 0,
        cornerRadiusBR: 0
      });

      legend.data.setAll(chart.series.values);
    }

    chartRef.current = root;

    return () => {
      root.dispose();
    };
  }, [data, chartId, series, chartConfig?.opacity, chartConfig?.strokeWidth]);

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