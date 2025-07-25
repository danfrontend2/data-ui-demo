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
import ActionManager from '../services/ActionManager';

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

      // Apply hidden series configuration for pie chart (hide specific slices)
      if (chartConfig?.hiddenSeries) {
        pieSeries.dataItems.forEach((dataItem) => {
          const category = dataItem.get("category");
          if (category && chartConfig.hiddenSeries?.includes(category)) {
            dataItem.hide();
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

        legend.data.setAll(pieSeries.dataItems);

        console.log('PieChart: Setting up single-series pie chart legend');
        
        // Set up recording of legend interactions for single-series pie chart
        const actionManager = ActionManager.getInstance();
        if (actionManager.isRecording()) {
          console.log('PieChart: Setting up single-series legend recording for chart:', chartId);
          
          // Use setTimeout to ensure legend is fully rendered before adding event handlers
          setTimeout(() => {
            legend.children.each(function(child: any, index: number) {
              child.events.on("click", function(ev: any) {
                console.log('PieChart: Single-series legend item clicked, index:', index);
                
                // For single-series pie charts, get the slice name by index
                let sliceName = 'Unknown';
                
                // Get the corresponding data item from pie series by index
                if (pieSeries.dataItems && pieSeries.dataItems.length > index) {
                  const pieDataItem = pieSeries.dataItems[index];
                  console.log('PieChart: Found pie data item by index:', pieDataItem);
                  
                  if (pieDataItem) {
                    const category = pieDataItem.get("category");
                    sliceName = (typeof category === 'string') ? category : 'Unknown';
                    console.log('PieChart: Got slice name from pie data item:', sliceName);
                  }
                }
                
                // Fallback: try to get from original data by index
                if (sliceName === 'Unknown' && data && data.length > index) {
                  const dataPoint = data[index];
                  console.log('PieChart: Fallback to original data point:', dataPoint);
                  
                  sliceName = (dataPoint.category && typeof dataPoint.category === 'string') ? dataPoint.category :
                             (dataPoint.name && typeof dataPoint.name === 'string') ? dataPoint.name :
                             (dataPoint.country && typeof dataPoint.country === 'string') ? dataPoint.country :
                             (dataPoint.element && typeof dataPoint.element === 'string') ? dataPoint.element :
                             'Unknown';
                  console.log('PieChart: Got slice name from original data:', sliceName);
                }
                
                console.log('PieChart: Final slice name determined:', sliceName);
                
                // Determine current visibility state and record the opposite
                let currentVisibility = true; // Default to visible
                
                if (pieSeries.dataItems && pieSeries.dataItems.length > index) {
                  const pieDataItem = pieSeries.dataItems[index];
                  if (pieDataItem) {
                    // Check if the slice is currently hidden
                    currentVisibility = !pieDataItem.isHidden();
                    console.log('PieChart: Current visibility of slice:', sliceName, '=', currentVisibility);
                  }
                }
                
                // Record the action - for single-series pie, we toggle individual slices
                actionManager.logAction('TOGGLE_CHART_SERIES', {
                  chartId,
                  seriesName: sliceName, // This is actually a slice name, not series name
                  visible: !currentVisibility // Toggle the current state
                });
              });
            });
          }, 500); // Give time for legend to fully render
        }
      }
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

        // Configure legend markers
        legend.markers.template.setAll({
          width: 16,
          height: 16
        });

        legend.data.setAll(chart.series.values);
        
                // Track series visibility changes for multi-series pie charts
        console.log('Setting up multi-series pie chart tracking');
        chart.series.each(function(series) {
          console.log('Setting up tracking for pie series:', series.get("name"));
          
          series.on("visible", function() {
            const seriesName = series.get("name");
            const isVisible = series.get("visible");
            
            console.log(`Multi-pie series visibility changed: ${seriesName} -> ${isVisible}`);
            console.log('Recording state:', ActionManager.getInstance().isRecording());
            console.log('Executing state:', ActionManager.getInstance().isExecutingMacro());
            
            // Only log during recording and NOT during macro execution
            if (ActionManager.getInstance().isRecording() && 
                !ActionManager.getInstance().isExecutingMacro() && 
                seriesName) {
              console.log(`Recording pie series toggle: ${seriesName} -> ${isVisible}`);
              ActionManager.getInstance().logAction('TOGGLE_CHART_SERIES', {
                chartId: chartId,
                seriesName: seriesName,
                visible: isVisible
              });
            }
          });
        });

        console.log('PieChart: Setting up legend for pie chart');
        
        // Set up recording of legend interactions
        const actionManager = ActionManager.getInstance();
        if (actionManager.isRecording()) {
          console.log('PieChart: Setting up legend recording for chart:', chartId);
          
          // Use setTimeout to ensure legend is fully rendered before adding event handlers
          setTimeout(() => {
            legend.children.each(function(child: any) {
              child.events.on("click", function(ev: any) {
                console.log('PieChart: Legend item clicked');
                
                // Try to get series name from multiple sources
                let seriesName = 'Unknown';
                
                if (child.dataItem) {
                  const dataItem = child.dataItem;
                  
                  // For pie charts, try to get the category/name from dataItem properties
                  seriesName = dataItem.get("category") || 
                              dataItem.get("name") || 
                              dataItem.get("categoryField") ||
                              'Unknown';
                  
                  // If still unknown, try to get from the raw data
                  if (seriesName === 'Unknown' && dataItem.dataContext) {
                    const rawData = dataItem.dataContext;
                    
                    // Try common field names for pie chart data
                    seriesName = rawData.category || 
                                rawData.name || 
                                rawData.label ||
                                rawData.country ||
                                rawData.element ||
                                'Unknown';
                  }
                }
                
                console.log('PieChart: Recording legend click for series:', seriesName);
                
                // Record the action
                actionManager.logAction('TOGGLE_CHART_SERIES', {
                  chartId,
                  seriesName,
                  visible: false // We'll improve this logic later
                });
              });
            });
          }, 500); // Give time for legend to fully render
        }
      }
    }

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
  }, [data, chartId, series, chartConfig?.opacity, chartConfig?.strokeWidth, chartConfig?.colorSet, chartConfig?.showLegend, chartConfig?.hiddenSeries]);

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