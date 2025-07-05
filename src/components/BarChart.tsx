import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { ChartDataPoint } from '../types';

interface BarChartProps {
  data: ChartDataPoint[];
  chartId: string;
  series?: Array<{
    field: string;
    name: string;
  }>;
}

const BarChart: React.FC<BarChartProps> = ({ data, chartId, series = [] }) => {
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
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    // Set data for X axis
    xAxis.data.setAll(data);

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

    // Create series for each field
    const chartSeries = (series.length ? series : [{
      field: Object.keys(data[0]).find(key => key !== 'category') || '',
      name: 'Value'
    }]).map((seriesConfig, index) => {
      const barSeries = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: seriesConfig.name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: seriesConfig.field,
          categoryXField: "category",
          tooltip: am5.Tooltip.new(root, {
            labelText: "{name}: {valueY}"
          })
        })
      );

      // Set base properties first
      barSeries.columns.template.setAll({
        tooltipY: 0,
        strokeOpacity: 0,
        width: am5.percent(90 / series.length), // Adjust width based on number of series
        tooltipText: "{name}: {valueY}"
      });

      // Add index to data for coloring
      const dataWithIndex = data.map((item, idx) => ({
        ...item,
        columnIndex: idx
      }));

      if (series.length <= 1) {
        // For single series, set color based on data item index
        barSeries.columns.template.adapters.add("fill", function(fill, target) {
          const dataContext = target.dataItem?.dataContext as any;
          return am5.color(colors[dataContext?.columnIndex % colors.length]);
        });
      } else {
        // For multiple series, use series index for color
        barSeries.columns.template.setAll({
          fill: am5.color(colors[index % colors.length])
        });
      }

      // Set up hovering animation
      barSeries.columns.template.states.create("hover", {
        fillOpacity: 0.8
      });

      barSeries.data.setAll(dataWithIndex);

      return barSeries;
    });

    // Create legend
    const legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50),
      marginTop: 15,
      marginBottom: 15
    }));

    legend.data.setAll(chartSeries);

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

export default BarChart; 