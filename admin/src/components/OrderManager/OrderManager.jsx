import { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Card,
  Tag,
  DatePicker,
  Badge,
  Divider,
  Typography,
  Row,
  Col,
  Tabs,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { baseUrl } from "../../constants";
import UserDetailsBox from "../Common/UserDetailsBox";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

dayjs.extend(advancedFormat);

const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingOrder, setEditingOrder] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState([]);
  const [activeChartTab, setActiveChartTab] = useState("1");

  // Color palette
  const colors = {
    primary: "#1890ff",
    success: "#52c41a",
    error: "#f5222d",
    warning: "#faad14",
    background: "rgba(11, 18, 55, 0.8)",
    cardHeader: "#2c3e50",
    textSecondary: "#666",
    border: "rgba(168, 45, 45, 0.1)",
    tableHeader: "rgba(19, 54, 75, 0.8)",
    pdfHeader: "rgba(12, 156, 245, 0.8)",
    chartColors: ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"],
  };

  useEffect(() => {
    fetchOrders();
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchText, dateRange, selectedStatus, selectedPayment]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/order/list`);
      setOrders(response.data.data);
      setFilteredOrders(response.data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Failed to fetch orders");
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/user/list`);
      setUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to fetch users");
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchText) {
      filtered = filtered.filter((order) =>
        Object.values(order).some((val) =>
          val?.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((order) => {
        const orderDate = dayjs(order.date);
        return (
          orderDate.isAfter(dateRange[0]) && orderDate.isBefore(dateRange[1])
        );
      });
    }

    // Status filter
    if (selectedStatus.length > 0) {
      filtered = filtered.filter((order) =>
        selectedStatus.includes(order.status)
      );
    }

    // Payment filter
    if (selectedPayment.length > 0) {
      const paymentValues = selectedPayment.map((val) => val === "paid");
      filtered = filtered.filter((order) =>
        paymentValues.includes(order.payment)
      );
    }

    setFilteredOrders(filtered);
  };

  // Prepare data for charts
  const getChartData = () => {
    // Status distribution
    const statusData = [
      { name: "Food Processing", value: filteredOrders.filter(o => o.status === "Food Processing").length },
      { name: "Out for Delivery", value: filteredOrders.filter(o => o.status === "Out for Delivery").length },
      { name: "Delivered", value: filteredOrders.filter(o => o.status === "Delivered").length },
    ];

    // Payment distribution
    const paymentData = [
      { name: "Paid", value: filteredOrders.filter(o => o.payment).length },
      { name: "Unpaid", value: filteredOrders.filter(o => !o.payment).length },
    ];

    // Monthly revenue
    const monthlyData = filteredOrders.reduce((acc, order) => {
      const month = dayjs(order.date).format("MMM YYYY");
      const existing = acc.find(item => item.name === month);
      if (existing) {
        existing.amount += order.amount;
      } else {
        acc.push({ name: month, amount: order.amount });
      }
      return acc;
    }, []).sort((a, b) => dayjs(a.name) - dayjs(b.name));

    // Top customers
    const customerData = filteredOrders.reduce((acc, order) => {
      const user = users.find(u => u._id === order.userId);
      const userName = user ? user.name : "Unknown";
      const existing = acc.find(item => item.name === userName);
      if (existing) {
        existing.orders += 1;
        existing.amount += order.amount;
      } else {
        acc.push({ name: userName, orders: 1, amount: order.amount });
      }
      return acc;
    }, []).sort((a, b) => b.orders - a.orders).slice(0, 5);

    return { statusData, paymentData, monthlyData, customerData };
  };

  const { statusData, paymentData, monthlyData, customerData } = getChartData();

  const handleEdit = (record) => {
    setEditingOrder({
      ...record,
      address: !record.address.firstName
        ? record.address
        : `${record.address.firstName},${record.address.lastName},${record.address.street},${record.address.city},${record.address.state}`,
    });
    form.setFieldsValue({
      ...record,
      address: !record.address.firstName
        ? record?.address
        : `${record.address.firstName},${record.address.lastName},${record.address.street},${record.address.city},${record.address.state}`,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/order/${id}`);
      message.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      message.error("Failed to delete order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      setActionLoading(true);
      try {
        if (editingOrder) {
          await axios.put(`${baseUrl}/api/order/${editingOrder._id}`, values);
          message.success("Order updated successfully");
        } else {
          await axios.post(`${baseUrl}/api/order`, values);
          message.success("Order created successfully");
        }
        setIsModalVisible(false);
        setEditingOrder(null);
        form.resetFields();
        fetchOrders();
      } catch (error) {
        console.error("Error saving order:", error);
        message.error("Failed to save order");
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingOrder(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add header with logo and title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Orders Report", 105, 20, { align: "center" });
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${dayjs().format("MMMM Do, YYYY")}`, 105, 30, { align: "center" });
    
    // Add summary statistics
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`Total Orders: ${filteredOrders.length}`, 14, 40);
    doc.text(`Paid Orders: ${filteredOrders.filter(o => o.payment).length}`, 14, 50);
    doc.text(`Revenue: $${filteredOrders.reduce((sum, o) => sum + o.amount, 0).toFixed(2)}`, 14, 60);

    const tableColumn = [
      "ID",
      "User",
      "Amount",
      "Status",
      "Payment",
      "Date",
    ];
    
    const tableRows = filteredOrders.map((order) => [
      order.oid,
      users.find(u => u._id === order.userId)?.name || order.userId,
      `$${order.amount.toFixed(2)}`,
      order.status,
      order.payment ? "Paid" : "Unpaid",
      dayjs(order.date).format("MMM D, YYYY"),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      styles: {
        cellPadding: 5,
        fontSize: 10,
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
      },
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: "right" }
      );
    }

    doc.save(`orders_report_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`);
  };

  const getStatusTag = (status) => {
    let color = "";
    switch (status) {
      case "Food Processing":
        color = "orange";
        break;
      case "Out for Delivery":
        color = "blue";
        break;
      case "Delivered":
        color = "green";
        break;
      default:
        color = "default";
    }
    return <Tag color={color}>{status}</Tag>;
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "oid",
      key: "oid",
      render: (text) => <Text strong>#{text}</Text>,
      width: 150,
    },
    {
      title: "Customer",
      dataIndex: "userId",
      render: (userId) => <UserDetailsBox id={userId} />,
      key: "userId",
      sorter: (a, b) => a.userId.localeCompare(b.userId),
      width: 150,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <Text strong style={{ color: colors.primary }}>
          ${amount.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
      width: 100,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (_, record) => {
        if (record.address.firstName) {
          return (
            <div style={{ width: 200 }}>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {`${record.address.firstName} ${record.address.lastName}`}
              </div>
              <div style={{ fontSize: "0.8em", color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {`${record.address.street}, ${record.address.city}, ${record.address.state}`}
              </div>
            </div>
          );
        }
        return (
          <div style={{ width: 200 }}>
            {record.address}
          </div>
        );
      },
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
      filters: [
        { text: "Food Processing", value: "Food Processing" },
        { text: "Out for Delivery", value: "Out for Delivery" },
        { text: "Delivered", value: "Delivered" },
      ],
      onFilter: (value, record) => record.status === value,
      width: 150,
    },
    {
      title: "Payment",
      dataIndex: "payment",
      key: "payment",
      render: (payment) => (
        <Badge
          status={payment ? "success" : "error"}
          text={payment ? "Paid" : "Unpaid"}
        />
      ),
      filters: [
        { text: "Paid", value: "paid" },
        { text: "Unpaid", value: "unpaid" },
      ],
      onFilter: (value, record) =>
        value === "paid" ? record.payment : !record.payment,
      width: 100,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("MMM D, YYYY"),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="text"
            style={{ color: colors.primary }}
          />
          <Popconfirm
            title="Are you sure you want to delete this order?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
              loading={actionLoading}
            />
          </Popconfirm>
        </Space>
      ),
      width: 120,
    },
  ];

  const resetFilters = () => {
    setSearchText("");
    setDateRange([]);
    setSelectedStatus([]);
    setSelectedPayment([]);
  };

  const renderCharts = () => (
    <Card 
      title="Order Management Charts"
      bordered={false}
      headStyle={{ background: colors.cardHeader, color: 'white' }}
    >
      <Tabs 
        defaultActiveKey="1" 
        onChange={(key) => setActiveChartTab(key)}
        activeKey={activeChartTab}
      >
        <TabPane tab={<span><PieChartOutlined /> Status Distribution</span>} key="1">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </TabPane>
        <TabPane tab={<span><BarChartOutlined /> Monthly Revenue</span>} key="2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
              <Legend />
              <Bar dataKey="amount" fill={colors.chartColors[0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </TabPane>
        <TabPane tab={<span><PieChartOutlined /> Payment Status</span>} key="3">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="rgba(59, 66, 112, 0.1)"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? colors.success : colors.error} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </TabPane>
        <TabPane tab={<span><LineChartOutlined /> Top Customers</span>} key="4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="orders" fill={colors.chartColors[0]} name="Orders" />
              <Bar yAxisId="right" dataKey="amount" fill={colors.chartColors[1]} name="Total Amount" />
            </BarChart>
          </ResponsiveContainer>
        </TabPane>
      </Tabs>
    </Card>
  );

  return (
    <div style={{ 
      padding: "24px",
      background: colors.background,
      minHeight: "100vh"
    }}>
      <Card
        title={<span style={{ color: 'white', fontSize: '20px' }}>Order Management</span>}
        bordered={false}
        headStyle={{ 
          background: colors.cardHeader,
          borderBottom: `1px solid ${colors.border}`
        }}
        bodyStyle={{ padding: '16px' }}
        style={{ 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          marginBottom: 24
        }}
        extra={
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={generatePDF}
            style={{ 
              background: colors.error,
              borderColor: colors.error,
              fontWeight: '500'
            }}
          >
            Export PDF
          </Button>
        }
      >
        {renderCharts()}

        <div style={{ marginBottom: 16 }}>
          <Space size="large" wrap>
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined style={{ color: colors.textSecondary }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />

            <DatePicker.RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: 250 }}
              placeholder={["Start Date", "End Date"]}
            />

            <Select
              mode="multiple"
              placeholder="Filter by status"
              style={{ width: 200 }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              suffixIcon={<FilterOutlined style={{ color: colors.textSecondary }} />}
              allowClear
            >
              <Option value="Food Processing">Food Processing</Option>
              <Option value="Out for Delivery">Out for Delivery</Option>
              <Option value="Delivered">Delivered</Option>
            </Select>

            <Select
              mode="multiple"
              placeholder="Filter by payment"
              style={{ width: 200 }}
              value={selectedPayment}
              onChange={setSelectedPayment}
              suffixIcon={<FilterOutlined style={{ color: colors.textSecondary }} />}
              allowClear
            >
              <Option value="paid">Paid</Option>
              <Option value="unpaid">Unpaid</Option>
            </Select>

            <Button 
              onClick={resetFilters}
              style={{ color: colors.textSecondary }}
            >
              Reset Filters
            </Button>
          </Space>
        </div>

        <Divider style={{ borderColor: colors.border }} />

        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            style={{ 
              background: colors.success,
              borderColor: colors.success,
              fontWeight: '500'
            }}
          >
            Add New Order
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="_id"
          loading={loading}
          scroll={{ x: true }}
          bordered
          style={{ borderRadius: '8px' }}
          rowClassName={() => "table-row"}
          pagination={{
            position: ['bottomRight'],
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`
          }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: colors.background }}>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>Total Orders: {filteredOrders.length}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={2}>
                  <Text strong>
                    Total Amount: $
                    {filteredOrders
                      .reduce((sum, o) => sum + o.amount, 0)
                      .toFixed(2)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Modal
        title={<span style={{ color: colors.cardHeader }}>{editingOrder ? "Edit Order" : "Add New Order"}</span>}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={actionLoading}
        width={700}
        destroyOnClose
        footer={[
          <Button key="back" onClick={handleModalCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={actionLoading} 
            onClick={handleModalOk}
            style={{ background: colors.primary, borderColor: colors.primary }}
          >
            {editingOrder ? "Update Order" : "Create Order"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label={<span style={{ fontWeight: '500' }}>Customer</span>}
            rules={[{ required: true, message: "Please select a customer" }]}
          >
            <Select
              showSearch
              placeholder="Select a customer"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map((user) => (
                <Option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {!editingOrder && (
            <Form.Item
              name="amount"
              label={<span style={{ fontWeight: '500' }}>Amount</span>}
              rules={[
                { required: true, message: "Please input the order amount" },
                {
                  validator: (_, value) => {
                    if (value && !isNaN(value) && parseFloat(value) > 0) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Amount must be greater than 0"));
                  },
                },
              ]}
              normalize={(value) => (value ? parseFloat(value) : value)}
            >
              <Input 
                prefix="$" 
                type="number" 
                step="0.01" 
                min="0.01" 
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  form.setFieldsValue({ amount: isNaN(value) ? '' : value });
                }}
              />
            </Form.Item>
          )}

          <Form.Item
            name="address"
            label={<span style={{ fontWeight: '500' }}>Delivery Address</span>}
            rules={[{ required: true, message: "Please input the address" }]}
          >
            <Input.TextArea
              rows={3}
              disabled={editingOrder}
              placeholder="Street, City, State, ZIP Code"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label={<span style={{ fontWeight: '500' }}>Order Status</span>}
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select placeholder="Select order status">
              <Option value="Food Processing">
                <Tag color="orange">Food Processing</Tag>
              </Option>
              <Option value="Out for Delivery">
                <Tag color="blue">Out for Delivery</Tag>
              </Option>
              <Option value="Delivered">
                <Tag color="green">Delivered</Tag>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="payment"
            label={<span style={{ fontWeight: '500' }}>Payment Status</span>}
            rules={[{ required: true, message: "Please select payment status" }]}
          >
            <Select placeholder="Select payment status">
              <Option value={true}>
                <Badge status="success" text="Paid" />
              </Option>
              <Option value={false}>
                <Badge status="error" text="Unpaid" />
              </Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background-color: ${colors.tableHeader} !important;
          color: white !important;
          font-weight: 500 !important;
        }
        .ant-table-row.table-row:hover td {
          background-color: rgba(0, 0, 0, 0.02) !important;
        }
        .ant-card-head-title {
          color: white !important;
        }
        .ant-select-selector, .ant-input, .ant-picker {
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
};

export default OrderManager;