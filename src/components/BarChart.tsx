import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Kelly from "@amcharts/amcharts5/themes/Kelly";
import am5themes_Material from "@amcharts/amcharts5/themes/Material";
import am5themes_Dataviz from "@amcharts/amcharts5/themes/Dataviz";
import am5themes_Moonrise from "@amcharts/amcharts5/themes/Moonrise";
import am5themes_Spirited from "@amcharts/amcharts5/themes/Spirited";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import { ChartDataPoint } from '../types';
import { ChartConfig } from '../types';
import ActionManager from '../services/ActionManager';

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

    const opacity = chartConfig?.opacity ?? 1;
    const strokeWidth = chartConfig?.strokeWidth ?? 2;

    if (series.length <= 1) {
      // Single series - create separate series for each data point
      data.forEach((item, index) => {
        const field = Object.keys(item).find(key => key !== 'category') || '';
        const value = item[field];

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
          strokeWidth: strokeWidth
        });

        // Add hover state
        barSeries.columns.template.states.create("hover", {
          fillOpacity: 0.8
        });

        barSeries.data.setAll([item]);
      });
    } else {
      // Multiple series - create one series per field
      series.forEach((seriesConfig) => {
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
          strokeWidth: strokeWidth
        });

        barSeries.data.setAll(data);
      });
    }

    // Add title if single series
    if (series.length === 1) {
      chart.children.unshift(
        am5.Label.new(root, {
          text: series[0].name,
          fontSize: 16,
          fontWeight: "600",
          textAlign: "center",
          x: am5.percent(50),
          centerX: am5.percent(50),
          paddingTop: 10,
          paddingBottom: 10
        })
      );
    }

    // Apply hidden series configuration
    if (chartConfig?.hiddenSeries) {
      chart.series.each((series) => {
        const seriesName = series.get("name");
        if (seriesName && chartConfig.hiddenSeries?.includes(seriesName)) {
          series.hide();
        }
      });
    }

    // Create legend if enabled
    if (chartConfig?.showLegend !== false) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          useDefaultMarker: true,
          clickTarget: "itemContainer"
        })
      );

      legend.data.setAll(chart.series.values);
      
      // Track series visibility changes for recording
      chart.series.each(function(series) {
        series.on("visible", function() {
          const seriesName = series.get("name");
          const isVisible = series.get("visible");
          
          // Only log during recording and NOT during macro execution
          if (ActionManager.getInstance().isRecording() && 
              !ActionManager.getInstance().isExecutingMacro() && 
              seriesName) {
            console.log(`Recording series toggle: ${seriesName} -> ${isVisible}`);
            ActionManager.getInstance().logAction('TOGGLE_CHART_SERIES', {
              chartId: chartId,
              seriesName: seriesName,
              visible: isVisible
            });
          }
        });
      });
    }

    // Set data for X axis
    xAxis.data.setAll(data);

    // Add cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "none",
      xAxis: xAxis,
      yAxis: yAxis
    }));

    // Register chart instance globally for ActionManager access
    if (!(window as any).chartInstances) {
      (window as any).chartInstances = {};
    }
    (window as any).chartInstances[chartId] = chart;

    // Save root for cleanup
    chartRef.current = root;

    return () => {
      // Unregister chart instance
      if ((window as any).chartInstances) {
        delete (window as any).chartInstances[chartId];
      }
      root.dispose();
    };
  }, [chartId, data, series, chartConfig?.opacity, chartConfig?.strokeWidth, chartConfig?.colorSet, chartConfig?.showLegend, chartConfig?.hiddenSeries]);

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