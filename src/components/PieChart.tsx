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
    console.log('PieChart data:', data);
    console.log('PieChart series:', series);

    // Create root element
    const root = am5.Root.new(chartId);

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
    console.log('Total series:', totalSeries);

    // Create series for each field
    const chartSeries = (series.length ? series : [{
      field: Object.keys(data[0]).find(key => key !== 'category') || '',
      name: 'Value'
    }]).map((seriesConfig, index) => {
      console.log('Creating series:', seriesConfig);
      console.log('With radius:', 90 - (index * (80 / totalSeries)));

      const colors = [
        0x6794dc,
        0x67b7dc,
        0x8067dc,
        0xdc67ce,
        0xdc6967,
        0xa367dc,
        0x67dcb0
      ];
      const color = am5.color(colors[index % colors.length]);

      // Для каждой следующей серии уменьшаем внешний и внутренний радиус
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

      pieSeries.slices.template.setAll({
        stroke: am5.color(0xffffff),
        strokeWidth: 2,
        fill: color,
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

      pieSeries.data.setAll(data);
      console.log('Series data set:', data);

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