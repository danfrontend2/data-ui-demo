import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Kelly from "@amcharts/amcharts5/themes/Kelly";
import am5themes_Material from "@amcharts/amcharts5/themes/Material";
import am5themes_Dataviz from "@amcharts/amcharts5/themes/Dataviz";
import am5themes_Moonrise from "@amcharts/amcharts5/themes/Moonrise";
import am5themes_Spirited from "@amcharts/amcharts5/themes/Spirited";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
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
    // Clean up any existing root
    if (chartRef.current) {
      chartRef.current.dispose();
    }

    // Create root element
    const root = am5.Root.new(chartId);

    // Get the selected theme
    const getTheme = (themeName?: string) => {
      switch (themeName) {
        case 'kelly':
          return am5themes_Kelly.new(root);
        case 'material':
          return am5themes_Material.new(root);
        case 'dataviz':
          return am5themes_Dataviz.new(root);
        case 'moonrisekingdom':
          return am5themes_Moonrise.new(root);
        case 'spirited':
          return am5themes_Spirited.new(root);
        case 'vividark':
          root.setThemes([
            am5themes_Animated.new(root),
            am5themes_Dark.new(root)
          ]);
          root.container.set("background", am5.Rectangle.new(root, {
            fill: am5.color(0x000000),
            fillOpacity: 1
          }));
          return am5themes_Dark.new(root);
        default:
          return am5themes_Kelly.new(root);
      }
    };

    // Set themes
    if (chartConfig?.colorSet !== 'vividark') {
      root.setThemes([
        am5themes_Animated.new(root),
        getTheme(chartConfig?.colorSet)
      ]);
    } else {
      getTheme('vividark');
    }

    // Create chart
    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(50)
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
      // Single series - create one series
      const field = Object.keys(data[0]).find(key => key !== 'category') || '';
      
      // Add title for single series
      chart.children.unshift(
        am5.Label.new(root, {
          text: series[0]?.name || field,
          fontSize: 16,
          fontWeight: "600",
          textAlign: "center",
          x: am5.percent(50),
          centerX: am5.percent(50),
          paddingTop: 10,
          paddingBottom: 10
        })
      );
      
      const pieSeries = chart.series.push(
        am5percent.PieSeries.new(root, {
          categoryField: "category",
          valueField: field,
          legendLabelText: "[{fill}]{category}[/]: {value}",
          legendValueText: "",
          radius: am5.percent(90)
        })
      );

      // Configure slices with dynamic stroke color
      pieSeries.slices.template.setAll({
        strokeWidth: chartConfig?.strokeWidth ?? 2,
        fillOpacity: chartConfig?.opacity ?? 1,
        templateField: "sliceSettings",
        cornerRadius: 5
      });

      // Set stroke color adapter to use darker version of fill color
      pieSeries.slices.template.adapters.add("stroke", (stroke, target) => {
        const fill = target.get("fill");
        if (fill) {
          // Use fill color number directly and make it darker
          const darkStroke = getStrokeColor(fill.hex);
          return darkStroke;
        }
        return stroke;
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
        strokeWidth: chartConfig?.strokeWidth ?? 2
      });

      pieSeries.data.setAll(data);

      // Create legend (always show for hiding/showing values)
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
      series.forEach((seriesConfig) => {
        const pieSeries = chart.series.push(
          am5percent.PieSeries.new(root, {
            name: seriesConfig.name,
            categoryField: "category",
            valueField: seriesConfig.field,
            legendLabelText: "[{fill}]{category}[/]: {value}",
            legendValueText: "",
            radius: am5.percent(90)
          })
        );

        // Configure slices
        pieSeries.slices.template.setAll({
          strokeWidth: chartConfig?.strokeWidth ?? 2,
          fillOpacity: chartConfig?.opacity ?? 1,
          cornerRadius: 5
        });

        // Set stroke color adapter to use darker version of fill color
        pieSeries.slices.template.adapters.add("stroke", (stroke, target) => {
          const fill = target.get("fill");
          if (fill) {
            // Use fill color number directly and make it darker
            const darkStroke = getStrokeColor(fill.hex);
            return darkStroke;
          }
          return stroke;
        });

        // Add hover state
        pieSeries.slices.template.states.create("hover", {
          scale: 1.05,
          fillOpacity: 0.8
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

      legend.data.setAll(chart.series.values);
    }

    // Save root for cleanup
    chartRef.current = root;

    return () => {
      root.dispose();
    };
  }, [data, chartId, series, chartConfig?.opacity, chartConfig?.strokeWidth, chartConfig?.colorSet]);

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