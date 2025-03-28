import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { Card } from 'react-bootstrap';

/**
 * ChoreTypeChart component - Displays chore distribution by type
 * Properly manages chart lifecycle to prevent memory leaks and errors
 */
const ChoreTypeChart = ({ choreData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartError, setChartError] = useState(null);

  // Process data for chart display
  const processChartData = () => {
    if (!choreData || !Array.isArray(choreData) || choreData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderWidth: 1
        }]
      };
    }

    // Group chores by type
    const choreTypes = {};
    choreData.forEach(chore => {
      const type = chore.type || 'Uncategorized';
      if (!choreTypes[type]) {
        choreTypes[type] = 0;
      }
      choreTypes[type]++;
    });

    // Create arrays for chart data
    const labels = Object.keys(choreTypes);
    const data = Object.values(choreTypes);
    
    // Generate colors for each type
    const colors = labels.map((_, index) => {
      const colorPalette = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#8AC249', '#EA526F',
        '#25CED1', '#FCEADE', '#FF8A5B', '#EA9AB2'
      ];
      return colorPalette[index % colorPalette.length];
    });

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 1
      }]
    };
  };

  // Create or update chart
  useEffect(() => {
    try {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }

      // Create new chart
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: processChartData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 15,
                  padding: 15,
                  font: {
                    size: 12
                  }
                }
              },
              title: {
                display: true,
                text: 'Chore Distribution by Type',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
      setChartError(null);
    } catch (error) {
      console.error("Chart creation error:", error);
      setChartError(`Failed to create chart: ${error.message}`);
    }

    // Cleanup function to destroy chart when component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [choreData]);

  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        {chartError ? (
          <div className="alert alert-danger">{chartError}</div>
        ) : (
          <div style={{ height: '300px', position: 'relative' }}>
            <canvas ref={chartRef} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ChoreTypeChart;