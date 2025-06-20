import { useState, useEffect, useRef } from "react";
import { Card, Typography, Spin, Empty, Select, Radio, Button, Tabs, Switch, message, Modal } from "antd";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DownloadOutlined, LineChartOutlined, PoweroffOutlined } from "@ant-design/icons";
import axios from "axios";
import { baseUrl } from "../../constants";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import "./Analytics.css";
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Analytics = () => {
  const [orderData, setOrderData] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [timeFilter, setTimeFilter] = useState("all");
  const [topItems, setTopItems] = useState(10);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const chartRef = useRef(null);
  
  // Power BI related states
  const [usePowerBI, setUsePowerBI] = useState(false);
  const [powerBILoading, setPowerBILoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [embedConfig, setEmbedConfig] = useState(null);
  const [embedError, setEmbedError] = useState(null);

  useEffect(() => {
    fetchData();
    fetchPowerBIReports();
  }, []);

  useEffect(() => {
    if (orderData.length > 0) {
      processChartData();
    }
  }, [orderData, timeFilter, topItems]);

  useEffect(() => {
    if (selectedReport) {
      getEmbedToken(selectedReport);
    }
  }, [selectedReport]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const ordersResponse = await axios.get(`${baseUrl}/api/order/list`);
      
      // Fetch food items
      const foodResponse = await axios.get(`${baseUrl}/api/food/list`);
      
      setOrderData(ordersResponse.data.data);
      setFoodItems(foodResponse.data.food_list || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPowerBIReports = async () => {
    try {
      setPowerBILoading(true);
      const response = await axios.get(`${baseUrl}/api/powerbi/reports`);
      setReports(response.data);
      
      // If reports exist, select the first one by default
      if (response.data.length > 0) {
        setSelectedReport(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching Power BI reports:', error);
      setEmbedError('Failed to fetch Power BI reports. Please check your configuration.');
    } finally {
      setPowerBILoading(false);
    }
  };

  const getEmbedToken = async (reportId) => {
    try {
      setPowerBILoading(true);
      const response = await axios.get(`${baseUrl}/api/powerbi/embed-token/${reportId}`);
      
      setEmbedConfig({
        type: 'report',
        id: response.data.reportId,
        embedUrl: response.data.embedUrl,
        accessToken: response.data.embedToken,
        tokenType: models.TokenType.Embed,
        settings: {
          panes: {
            filters: {
              expanded: false,
              visible: true
            }
          },
          background: models.BackgroundType.Transparent,
        }
      });
      
      setEmbedError(null);
    } catch (error) {
      console.error('Error getting embed token:', error);
      setEmbedError('Failed to load Power BI report. Please check your configuration.');
    } finally {
      setPowerBILoading(false);
    }
  };

  const processChartData = () => {
    // Filter orders by payment status (paid only)
    const paidOrders = orderData.filter(order => order.payment === true);
    
    // Apply time filter if needed
    const filteredOrders = filterOrdersByTime(paidOrders);
    
    // Create a map to store count of each food item
    const foodCountMap = {};
    
    // Count each food item occurrence
    filteredOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemId = item._id;
          const itemName = item.name;
          const quantity = item.quantity || 1;
          
          if (!foodCountMap[itemId]) {
            foodCountMap[itemId] = {
              id: itemId,
              name: itemName,
              count: 0,
              totalRevenue: 0
            };
          }
          
          foodCountMap[itemId].count += quantity;
          foodCountMap[itemId].totalRevenue += (item.price * quantity);
        });
      }
    });
    
    // Convert to array for chart display
    let data = Object.values(foodCountMap);
    
    // Sort by count (descending)
    data.sort((a, b) => b.count - a.count);
    
    // Limit to top N items if needed
    if (topItems > 0) {
      data = data.slice(0, topItems);
    }
    
    setChartData(data);
  };
  
  const filterOrdersByTime = (orders) => {
    if (timeFilter === "all") return orders;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeFilter) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return orders;
    }
    
    return orders.filter(order => new Date(order.date) >= cutoffDate);
  };

  const handleTimeFilterChange = (e) => {
    setTimeFilter(e.target.value);
  };

  const handleChartTypeChange = (value) => {
    setChartType(value);
  };
  
  const handleTopItemsChange = (value) => {
    setTopItems(value);
  };
  
  const handleReportChange = (reportId) => {
    setSelectedReport(reportId);
  };

  const togglePowerBI = (checked) => {
    setUsePowerBI(checked);
    if (checked && !embedConfig && reports.length > 0) {
      getEmbedToken(reports[0].id);
    }
  };

  const generatePDF = async () => {
    if (chartData.length === 0) return;
    
    setPdfGenerating(true);
    
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title and date
      const timeFilterTexts = {
        all: "All Time",
        week: "Last 7 Days",
        month: "Last Month",
        year: "Last Year"
      };
      
      const title = "Food Item Popularity Report";
      const subtitle = `${timeFilterTexts[timeFilter]} - Generated on ${new Date().toLocaleDateString()}`;
      
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text(title, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, 105, 30, { align: 'center' });
      
      // Capture chart as image
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, {
          scale: 2,
          backgroundColor: '#FFFFFF'
        });
        
        // Convert canvas to PNG image
        const imgData = canvas.toDataURL('image/png');
        
        // Add chart image to PDF
        doc.addImage(imgData, 'PNG', 15, 40, 180, 100);
        
        // Add summary stats
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Summary", 15, 150);
        
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);
        doc.text(`Total Food Items Sold: ${chartData.reduce((sum, item) => sum + item.count, 0)}`, 15, 160);
        doc.text(`Total Revenue: $${chartData.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)}`, 15, 170);
        doc.text(`Most Popular Item: ${chartData[0].name}`, 15, 180);
        
        // Add table of data
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("Detailed Data", 15, 195);
        
        // Create table data
        const tableData = chartData.map((item, index) => [
          index + 1,
          item.name,
          item.count,
          `$${item.totalRevenue.toFixed(2)}`,
          `$${(item.totalRevenue / item.count).toFixed(2)}`
        ]);
        
        // Create table with headers
        doc.autoTable({
          startY: 200,
          head: [['#', 'Food Item', 'Quantity Sold', 'Total Revenue', 'Avg Price']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [24, 144, 255],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 245, 255]
          },
          margin: { left: 15, right: 15 },
          styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [200, 200, 200]
          },
          columnStyles: {
            0: { cellWidth: 10 },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' }
          }
        });
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Food Delivery Analytics - Page ${i} of ${pageCount}`,
            105, 
            doc.internal.pageSize.height - 10, 
            { align: 'center' }
          );
        }
        
        // Save the PDF
        doc.save(`food-popularity-report-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Generate PDF from Power BI report
  const generatePowerBIReport = async () => {
    message.info("Exporting report from Power BI...");
    
    try {
      // In a real implementation, use the Power BI REST API to export the report
      // This requires backend implementation to handle the export
      // For now, we'll just show a message
      
      setTimeout(() => {
        message.success("Report generated successfully!");
      }, 2000);
    } catch (error) {
      console.error("Error generating Power BI report:", error);
      message.error("Failed to generate report from Power BI");
    }
  };

  const renderPowerBIOptions = () => {
    if (powerBILoading) {
      return <Spin />;
    }
    
    if (embedError) {
      return <Text type="danger">{embedError}</Text>;
    }
    
    if (reports.length === 0) {
      return <Text type="warning">No Power BI reports found. Please configure your Power BI workspace.</Text>;
    }
    
    return (
      <Select
        value={selectedReport}
        onChange={handleReportChange}
        style={{ width: 300, marginBottom: 16 }}
        placeholder="Select a report"
      >
        {reports.map(report => (
          <Option key={report.id} value={report.id}>{report.name}</Option>
        ))}
      </Select>
    );
  };
  
  const renderPowerBIEmbed = () => {
    if (powerBILoading) {
      return (
        <div className="powerbi-loading">
          <Spin size="large" />
          <p>Loading Power BI report...</p>
        </div>
      );
    }
    
    if (embedError) {
      return (
        <Card className="powerbi-error-card">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {embedError}
                <br />
                <Button type="link" onClick={fetchPowerBIReports}>Try Again</Button>
              </span>
            }
          />
        </Card>
      );
    }
    
    if (!embedConfig) {
      return (
        <Card className="powerbi-error-card">
          <Empty
            description={
              <span>
                No Power BI report configured
                <br />
                <Button type="link" onClick={fetchPowerBIReports}>Refresh Reports</Button>
              </span>
            }
          />
        </Card>
      );
    }
    
    // Check if we're using mock data
    const isMockToken = embedConfig.accessToken === "mock-embed-token-for-testing-purposes-only";
    
    if (isMockToken) {
      return (
        <Card className="powerbi-container" title="Mock Power BI Report">
          <div style={{ padding: "20px", height: "calc(70vh - 100px)" }}>
            <div style={{ marginBottom: "20px" }}>
              <Text type="warning">
                Using mock Power BI data. In a real implementation, an actual Power BI report would be displayed here.
              </Text>
            </div>
            
            <div style={{ 
              height: "calc(100% - 40px)", 
              display: "flex", 
              flexDirection: "column", 
              gap: "20px",
              background: "#f9f9f9",
              padding: "20px",
              borderRadius: "8px"
            }}>
              <div style={{ display: "flex", gap: "20px" }}>
                <Card 
                  title="Total Revenue" 
                  style={{ flex: 1 }} 
                  bodyStyle={{ 
                    fontSize: "24px", 
                    fontWeight: "bold", 
                    color: "#1890ff",
                    textAlign: "center"
                  }}
                >
                  $48,294.25
                </Card>
                <Card 
                  title="Orders" 
                  style={{ flex: 1 }} 
                  bodyStyle={{ 
                    fontSize: "24px", 
                    fontWeight: "bold", 
                    color: "#52c41a",
                    textAlign: "center"
                  }}
                >
                  723
                </Card>
                <Card 
                  title="Top Food Item" 
                  style={{ flex: 1 }} 
                  bodyStyle={{ 
                    fontSize: "24px", 
                    fontWeight: "bold", 
                    color: "#fa8c16",
                    textAlign: "center"
                  }}
                >
                  Chicken Burger
                </Card>
              </div>
              
              <Card title="Monthly Sales Trend">
                <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text type="secondary">Mock Chart Area - Real Power BI would show actual charts here</Text>
                </div>
              </Card>
              
              <Card title="Food Category Performance">
                <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text type="secondary">Mock Chart Area - Real Power BI would show actual charts here</Text>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      );
    }
    
    return (
      <div className="powerbi-container">
        <PowerBIEmbed
          embedConfig={embedConfig}
          cssClassName="powerbi-report"
          getEmbeddedComponent={(embeddedReport) => {
            // You can store the report object for later use
            console.log('Report embedded:', embeddedReport);
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <Spin size="large" />
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <Title level={3}>Food Item Popularity</Title>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
            <Text>Power BI Analytics:</Text>
            <Switch 
              checked={usePowerBI} 
              onChange={togglePowerBI}
              style={{ marginLeft: 8 }}
            />
            {usePowerBI && <Text type="secondary" style={{ marginLeft: 8 }}>Enabled</Text>}
          </div>
        </div>
        
        {usePowerBI ? (
          <div className="powerbi-controls">
            {renderPowerBIOptions()}
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={generatePowerBIReport}
              style={{ marginLeft: 16 }}
            >
              Export Power BI Report
            </Button>
          </div>
        ) : (
          <div className="analytics-filters">
            <Radio.Group value={timeFilter} onChange={handleTimeFilterChange}>
              <Radio.Button value="all">All Time</Radio.Button>
              <Radio.Button value="week">Last 7 Days</Radio.Button>
              <Radio.Button value="month">Last Month</Radio.Button>
              <Radio.Button value="year">Last Year</Radio.Button>
            </Radio.Group>
            
            <Select
              value={chartType}
              onChange={handleChartTypeChange}
              style={{ width: 130, marginLeft: 16 }}
            >
              <Option value="bar">Vertical Bars</Option>
              <Option value="horizontal">Horizontal Bars</Option>
            </Select>
            
            <Select
              value={topItems}
              onChange={handleTopItemsChange}
              style={{ width: 120, marginLeft: 16 }}
            >
              <Option value={5}>Top 5</Option>
              <Option value={10}>Top 10</Option>
              <Option value={15}>Top 15</Option>
              <Option value={0}>All Items</Option>
            </Select>
            
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={generatePDF}
              disabled={pdfGenerating || chartData.length === 0}
              loading={pdfGenerating}
              style={{ marginLeft: 16 }}
            >
              {pdfGenerating ? 'Generating PDF...' : 'Download PDF Report'}
            </Button>
          </div>
        )}
      </div>

      {usePowerBI ? (
        renderPowerBIEmbed()
      ) : (
        <>
          <Card className="analytics-chart-card">
            {chartData.length > 0 ? (
              <div ref={chartRef}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    layout={chartType === "horizontal" ? "vertical" : "horizontal"}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    {chartType === "horizontal" ? (
                      <>
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                      </>
                    ) : (
                      <>
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                      </>
                    )}
                    <Tooltip formatter={(value, name) => [value, name === "count" ? "Orders" : "Revenue ($)"]} />
                    <Legend />
                    <Bar dataKey="count" name="Order Quantity" fill="#1890ff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="No paid orders found" />
            )}
          </Card>

          <Card className="analytics-summary-card">
            <Title level={4}>Food Item Popularity Summary</Title>
            <div className="analytics-stats">
              <div className="stat-item">
                <p className="stat-label">Total Food Items Sold</p>
                <p className="stat-value">{chartData.reduce((sum, item) => sum + item.count, 0)}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Total Revenue</p>
                <p className="stat-value">${chartData.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Most Popular Item</p>
                <p className="stat-value">{chartData.length > 0 ? chartData[0].name : 'N/A'}</p>
              </div>
            </div>
          </Card>
          
          <Card className="analytics-table-card">
            <Title level={4}>Detailed Food Item Data</Title>
            <div className="analytics-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Food Item</th>
                    <th>Quantity Sold</th>
                    <th>Total Revenue</th>
                    <th>Avg. Price per Item</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.count}</td>
                      <td>${item.totalRevenue.toFixed(2)}</td>
                      <td>${(item.totalRevenue / item.count).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Analytics; 