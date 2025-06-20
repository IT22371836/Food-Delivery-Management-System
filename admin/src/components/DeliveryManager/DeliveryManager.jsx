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
  Divider,
  Tag,
  DatePicker,
  Typography,
} from "antd";
import { 
  SearchOutlined, 
  FilePdfOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  SyncOutlined 
} from "@ant-design/icons";
import axios from "axios";
import { baseUrl } from "../../constants";
import jsPDF from "jspdf";
import "jspdf-autotable";
import DeliveryPersonManager from "../DeliverPersonManager/DeliverPersonManager";
import dayjs from "dayjs";

const { Option } = Select;
const { Title, Text } = Typography;

const statusColors = {
  'Assigned': 'blue',
  'In Progress': 'orange',
  'Completed': 'green',
  'Cancelled': 'red'
};

const DeliveryManager = () => {
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
  const [showDeliveryPersons, setShowDeliveryPersons] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  useEffect(() => {
    fetchAssignments();
    fetchDeliveryPersons();
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = assignments.filter(
      (assignment) =>
        assignment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.orderId?.oid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${assignment.deliveryPersonId?.firstName} ${assignment.deliveryPersonId?.lastName}`
          .toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAssignments(filtered);
  }, [searchTerm, assignments]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/delivery/assignments`);
      setAssignments(response.data.data);
      setFilteredAssignments(response.data.data);
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
      setOrders(response.data.data.filter(order => !order.isDelivered));
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
      orderId: assignment.orderId?._id,
      deliveryPersonId: assignment.deliveryPersonId?._id,
      status: assignment.status,
      assignedAt: assignment.assignedAt ? dayjs(assignment.assignedAt) : null
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payload = {
        ...values,
        assignedAt: values.assignedAt ? values.assignedAt.toISOString() : new Date().toISOString()
      };

      if (modalType === "create") {
        await axios.post(`${baseUrl}/api/delivery/assignments`, payload);
        message.success("Delivery assignment created successfully");
      } else {
        await axios.put(
          `${baseUrl}/api/delivery/assignments/${selectedAssignment._id}`,
          payload
        );
        message.success("Delivery assignment updated successfully");
      }
      
      setModalVisible(false);
      fetchAssignments();
      fetchOrders(); // Refresh orders to update delivered status
    } catch (error) {
      console.error("Error:", error);
      message.error(error.response?.data?.message || `Failed to ${modalType} delivery assignment`);
    } finally {
      setLoading(false);
    }
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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Delivery Assignments Report", 14, 15);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableColumn = [
      "Assignment ID",
      "Order ID",
      "Delivery Person",
      "Status",
      "Assigned At",
    ];
    const tableRows = filteredAssignments.map((assignment) => [
      assignment._id.substring(0, 8) + '...',
      assignment.orderId?.oid || 'N/A',
      assignment.deliveryPersonId 
        ? `${assignment.deliveryPersonId.firstName} ${assignment.deliveryPersonId.lastName}`
        : 'Unassigned',
      assignment.status,
      new Date(assignment.assignedAt).toLocaleString(),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    doc.save(`delivery_assignments_${new Date().getTime()}.pdf`);
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
      title: "Order ID",
      dataIndex: ["orderId", "oid"],
      key: "orderId",
      render: (oid) => oid || 'N/A',
      sorter: (a, b) => (a.orderId?.oid || '').localeCompare(b.orderId?.oid || ''),
    },
    {
      title: "Delivery Person",
      dataIndex: "deliveryPersonId",
      key: "deliveryPersonId",
      render: (person) => person 
        ? `${person.firstName} ${person.lastName}` 
        : <Text type="danger">Unassigned</Text>,
      sorter: (a, b) => 
        (a.deliveryPersonId?.firstName || '').localeCompare(b.deliveryPersonId?.firstName || ''),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>{status}</Tag>
      ),
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      filters: Object.keys(statusColors).map(status => ({
        text: status,
        value: status
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Assigned At",
      dataIndex: "assignedAt",
      key: "assignedAt",
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A',
      sorter: (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size="small"
            style={{ backgroundColor: '#1890ff', color: 'white' }}
          />
          <Popconfirm
            title="Are you sure to delete this assignment?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
              style={{ backgroundColor: '#ff4d4f', color: 'white' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
      <div style={{ 
        background: 'linear-gradient(135deg,rgb(9, 24, 45) 0%,rgb(234, 237, 242) 100%)',
        minHeight: '100vh',
        padding: '20px'
      }}></div>
      
  return (
    <div style={{ 
      background: 'linear-gradient(135deg,rgb(65, 86, 117) 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Card
        style={{
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.9)'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="mb-0" style={{ color: '#2c3e50' }}>
            <span style={{ 
              background: 'linear-gradient(90deg, #1890ff, #722ed1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Delivery Management
            </span>
          </Title>
          <div className="flex items-center gap-2">
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchAssignments}
              loading={loading}
              style={{ backgroundColor: '#13c2c2', color: 'white' }}
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            placeholder="Search assignments..."
            prefix={<SearchOutlined />}
            onChange={handleSearch}
            style={{ 
              width: 250,
              borderRadius: '6px',
              border: '1px solidrgb(164, 92, 92)'
            }}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
            style={{ 
              background: 'linear-gradient(90deg, #52c41a, #389e0d)',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            New Assignment
          </Button>
          <Button 
            icon={<FilePdfOutlined />} 
            onClick={generatePDF}
            style={{ 
              background: 'linear-gradient(90deg, #f5222d, #cf1322)',
              color: 'white',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            Export PDF
          </Button>
          <Button 
            type={showDeliveryPersons ? 'primary' : 'default'}
            icon={<TeamOutlined />}
            onClick={() => setShowDeliveryPersons(!showDeliveryPersons)}
            style={{ 
              background: showDeliveryPersons ? '#722ed1' : '',
              color: showDeliveryPersons ? 'white' : '',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            {showDeliveryPersons ? 'Hide Persons' : 'Manage Persons'}
          </Button>
        </div>

        {showDeliveryPersons && (
          <>
            <Divider orientation="left" style={{ color: '#595959' }}>
              Delivery Persons Management
            </Divider>
            <div style={{ 
              background: 'rgba(248, 249, 250, 0.5)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <DeliveryPersonManager />
            </div>
            <Divider />
          </>
        )}

        <Table
          loading={loading}
          dataSource={filteredAssignments}
          columns={columns}
          rowKey="_id"
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: true }}
          bordered
          style={{
            borderRadius: '8px',
            overflow: 'hidden'
          }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
        />

        <Modal
          title={
            <span>
              {modalType === "create" ? (
                <span style={{ color: '#52c41a' }}>
                  <PlusOutlined /> Create Delivery Assignment
                </span>
              ) : (
                <span style={{ color: '#1890ff' }}>
                  <EditOutlined /> Edit Delivery Assignment
                </span>
              )}
            </span>
          }
          visible={modalVisible}
          onOk={handleModalOk}
          onCancel={() => setModalVisible(false)}
          confirmLoading={loading}
          width={600}
          destroyOnClose
          bodyStyle={{ 
            padding: '24px',
            background: 'rgba(77, 73, 111, 0.8)'
          }}
          footer={[
            <Button 
              key="back" 
              onClick={() => setModalVisible(false)}
              style={{ borderRadius: '6px' }}
            >
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={loading} 
              onClick={handleModalOk}
              style={{ 
                borderRadius: '6px',
                background: modalType === 'create' ? '#52c41a' : '#1890ff',
                border: 'none'
              }}
            >
              {modalType === "create" ? "Create" : "Update"}
            </Button>,
          ]}
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
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                style={{ borderRadius: '6px' }}
              >
                {orders.map((order) => (
                  <Option key={order._id} value={order._id}>
                    {order.oid} - {order.customerName} ({order.items.length} items)
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
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                style={{ borderRadius: '6px' }}
              >
                {deliveryPersons.map((person) => (
                  <Option key={person._id} value={person._id}>
                    {person.firstName} {person.lastName} ({person.vehicleNumber})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select a status!" }]}
            >
              <Select style={{ borderRadius: '6px' }}>
                {Object.keys(statusColors).map(status => (
                  <Option key={status} value={status}>
                    <Tag color={statusColors[status]}>{status}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="assignedAt"
              label="Assigned Date & Time"
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm" 
                style={{ width: '100%', borderRadius: '6px' }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>

      <style jsx global>{`
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        .ant-table-thead > tr > th {
          background-color: #f0f2f5 !important;
          font-weight: 600 !important;
        }
        .ant-tag {
          border-radius: 4px;
        }
        .ant-btn {
          border-radius: 6px;
        }
        .ant-input {
          border-radius: 6px;
        }
        .ant-select-selector {
          border-radius: 6px !important;
        }
      `}</style>
    </div>
  );
};

export default DeliveryManager;