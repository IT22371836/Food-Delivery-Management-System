import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Space,
  message,
  Popconfirm,
  Card,
  Tag,
  Typography,
  DatePicker,
  Badge,
  Statistic,
  Divider,
  Row,
  Col
} from "antd";
import { 
  SearchOutlined, 
  FilePdfOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import { baseUrl } from "../../constants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const statusColors = {
  'Assigned': 'processing',
  'Completed': 'success',
  'Pending': 'warning'
};

const OrderManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    fetchAssignments();
    fetchDeliveryPersons();
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = assignments;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (assignment) =>
          assignment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.orderId._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${assignment.deliveryPersonId?.firstName} ${assignment.deliveryPersonId?.lastName}`
            .toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by date range
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter(assignment => {
        const assignedDate = dayjs(assignment.assignedAt);
        return assignedDate.isAfter(dateRange[0]) && assignedDate.isBefore(dateRange[1]);
      });
    }
    
    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }
    
    setFilteredAssignments(filtered);
  }, [searchTerm, assignments, dateRange, statusFilter]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/delivery/assignments`);
      const filteredData = response.data.data.filter(
        (assignment) =>
          assignment.deliveryPersonId.email ===
          localStorage.getItem("deliveryPersonEmail")
      );
      setAssignments(filteredData);
      setFilteredAssignments(filteredData);
    } catch (error) {
      message.error("Failed to fetch delivery assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/order/list`);
      setOrders(response.data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Failed to fetch orders");
    }
    setLoading(false);
  };

  const fetchDeliveryPersons = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/delivery-person`);
      setDeliveryPersons(response.data.data);
    } catch (error) {
      message.error("Failed to fetch delivery persons");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCreate = () => {
    setModalType("create");
    setSelectedAssignment(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (assignment) => {
    setModalType("edit");
    setSelectedAssignment(assignment);
    form.setFieldsValue({
      orderId: assignment.orderId._id,
      deliveryPersonId: assignment.deliveryPersonId._id,
      status: assignment.status,
    });
    setModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        if (modalType === "create") {
          await axios.post(`${baseUrl}/api/delivery/assignments`, values);
          message.success("Delivery assignment created successfully");
        } else {
          await axios.put(
            `${baseUrl}/api/delivery/assignments/${selectedAssignment._id}`,
            values
          );
          message.success("Delivery assignment updated successfully");
        }
        setModalVisible(false);
        fetchAssignments();
      } catch (error) {
        message.error(`Failed to ${modalType} delivery assignment`);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/delivery/assignments/${id}`);
      message.success("Delivery assignment deleted successfully");
      fetchAssignments();
    } catch (error) {
      message.error("Failed to delete delivery assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setLoading(true);
    try {
      await axios.put(`${baseUrl}/api/delivery/assignments/${id}`, { status });
      message.success("Status updated successfully");
      fetchAssignments();
    } catch (error) {
      message.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Delivery Assignments Report", 14, 20);
    
    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${dayjs().format("MMMM D, YYYY h:mm A")}`, 14, 27);
    
    // Add a line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 30, 200, 30);
    
    // Table data
    const headers = [
      "Assignment ID",
      "Order ID",
      "Delivery Person",
      "Status",
      "Assigned At"
    ];
    
    const data = filteredAssignments.map(assignment => [
      assignment._id.substring(0, 8) + '...',
      assignment.orderId._id.substring(0, 8) + '...',
      `${assignment.deliveryPersonId?.firstName} ${assignment.deliveryPersonId?.lastName}`,
      assignment.status,
      dayjs(assignment.assignedAt).format("MMM D, YYYY h:mm A")
    ]);
    
    // Generate table
    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        textColor: [40, 40, 40],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 35 }
    });
    
    // Save the PDF
    doc.save(`delivery_assignments_${dayjs().format("YYYYMMDDHHmm")}.pdf`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleOutlined />;
      case 'Assigned':
        return <SyncOutlined spin />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const columns = [
    {
      title: "Assignment ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <Text copyable>{id.substring(0, 8)}...</Text>,
      sorter: (a, b) => a._id.localeCompare(b._id),
    },
    {
      title: "Order Details",
      dataIndex: "orderId",
      key: "order",
      render: (order) => (
        <div>
          <div><Text strong>ID:</Text> {order._id.substring(0, 8)}...</div>
          <div><Text strong>Items:</Text> {order.items.length}</div>
        </div>
      ),
    },
    {
      title: "Delivery Person",
      dataIndex: "deliveryPersonId",
      key: "deliveryPersonId",
      render: (person) => (
        <div>
          <div>{person?.firstName} {person?.lastName}</div>
          <Text type="secondary">{person?.email}</Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          defaultValue={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record._id, value)}
          suffixIcon={getStatusIcon(status)}
        >
          <Option value="Assigned">
            <Badge status="processing" text="Assigned" />
          </Option>
          <Option value="Completed">
            <Badge status="success" text="Completed" />
          </Option>
        </Select>
      ),
      filters: [
        { text: 'Assigned', value: 'Assigned' },
        { text: 'Completed', value: 'Completed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Assigned At",
      dataIndex: "assignedAt",
      key: "assignedAt",
      render: (date) => dayjs(date).format("MMM D, YYYY h:mm A"),
      sorter: (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure to delete this assignment?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stats = [
    {
      title: 'Total Assignments',
      value: assignments.length,
      icon: <FilePdfOutlined />,
      color: '#1890ff'
    },
    {
      title: 'Completed',
      value: assignments.filter(a => a.status === 'Completed').length,
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    },
    {
      title: 'Pending',
      value: assignments.filter(a => a.status !== 'Completed').length,
      icon: <ClockCircleOutlined />,
      color: '#faad14'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Delivery Management</Title>}
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
            >
              New Assignment
            </Button>
            <Button 
              icon={<FilePdfOutlined />} 
              onClick={generatePDF}
              className="pdf-btn"
            >
              Export PDF
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {stats.map((stat, index) => (
            <Col span={8} key={index}>
              <Card bordered={false}>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.icon}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search assignments..."
                prefix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                value={searchTerm}
              />
            </Col>
            <Col span={8}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by status"
                allowClear
                onChange={setStatusFilter}
                value={statusFilter}
              >
                <Option value="Assigned">Assigned</Option>
                <Option value="Completed">Completed</Option>
              </Select>
            </Col>
            <Col span={8}>
              <RangePicker 
                style={{ width: '100%' }}
                onChange={setDateRange}
                showTime
                value={dateRange}
              />
            </Col>
          </Row>
        </div>

        <Table
          loading={loading}
          dataSource={filteredAssignments}
          columns={columns}
          rowKey="_id"
          bordered
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} assignments`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={
          <span>
            {modalType === "create" ? (
              <PlusOutlined style={{ marginRight: 8 }} />
            ) : (
              <EditOutlined style={{ marginRight: 8 }} />
            )}
            {modalType === "create" 
              ? "Create New Assignment" 
              : "Edit Assignment"}
          </span>
        }
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="orderId"
            label="Order"
            rules={[{ required: true, message: "Please select an order!" }]}
          >
            <Select
              showSearch
              placeholder="Select an order"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {orders.map((order) => (
                <Option key={order._id} value={order._id}>
                  {`Order #${order._id.substring(0, 8)} - ${order.items.length} items`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="deliveryPersonId"
            label="Delivery Person"
            rules={[
              { required: true, message: "Please select a delivery person!" },
            ]}
          >
            <Select
              showSearch
              placeholder="Select a delivery person"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {deliveryPersons.map((person) => (
                <Option key={person._id} value={person._id}>
                  {`${person.firstName} ${person.lastName} (${person.email})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status!" }]}
          >
            <Select>
              <Option value="Assigned">
                <Badge status="processing" text="Assigned" />
              </Option>
              <Option value="Completed">
                <Badge status="success" text="Completed" />
              </Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderManagement;