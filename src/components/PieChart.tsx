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

    if (series.length <= 1) {
      // Single series - create one series with individual colors
      const field = Object.keys(data[0]).find(key => key !== 'category') || '';
      const pieSeries = chart.series.push(
        am5percent.PieSeries.new(root, {
          categoryField: "category",
          valueField: field,
          legendLabelText: "{category}: {value}",
          legendValueText: ""
        })
      );

      // Set colors for individual slices
      pieSeries.slices.template.setAll({
        strokeWidth: 2,
        stroke: am5.color(0xffffff),
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
        stroke: am5.color(0xffffff),
        strokeWidth: 2
      });

      // Prepare data with colors
      const coloredData = data.map((item, index) => ({
        ...item,
        sliceSettings: {
          fill: am5.color(colors[index % colors.length])
        }
      }));

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
        const color = am5.color(colors[index % colors.length]);
        const pieSeries = chart.series.push(
          am5percent.PieSeries.new(root, {
            name: seriesConfig.name,
            categoryField: "category",
            valueField: seriesConfig.field,
            legendLabelText: "{category}",
            legendValueText: "{value}",
            fill: color
          })
        );

        pieSeries.slices.template.setAll({
          strokeWidth: 2,
          stroke: am5.color(0xffffff),
          fill: color
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
  }, [data, chartId, series]);

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