import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Space,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { baseUrl } from "../../constants";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { Option } = Select;

const DeliveryPersonManager = () => {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [filteredDeliveryPersons, setFilteredDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingDeliveryPerson, setEditingDeliveryPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  useEffect(() => {
    const filtered = deliveryPersons.filter(
      (person) =>
        person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.nic.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDeliveryPersons(filtered);
  }, [searchTerm, deliveryPersons]);

  const fetchDeliveryPersons = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/delivery-person`);
      setDeliveryPersons(response.data.data);
      setFilteredDeliveryPersons(response.data.data);
    } catch (error) {
      message.error("Failed to fetch delivery persons");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDeliveryPerson(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (person) => {
    setEditingDeliveryPerson(person);
    form.setFieldsValue(person);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/delivery-person/${id}`);
      message.success("Delivery person deleted successfully");
      fetchDeliveryPersons();
    } catch (error) {
      message.error("Failed to delete delivery person");
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        if (editingDeliveryPerson) {
          await axios.put(
            `${baseUrl}/api/delivery-person/${editingDeliveryPerson._id}`,
            values
          );
          message.success("Delivery person updated successfully");
        } else {
          await axios.post(`${baseUrl}/api/delivery-person`, values);
          message.success("Delivery person added successfully");
        }
        setModalVisible(false);
        fetchDeliveryPersons();
      } catch (error) {
        message.error("Failed to save delivery person");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Delivery Persons List", 14, 15);

    const tableColumn = ["Name", "NIC", "Age", "Vehicle Type", "Address"];
    const tableRows = filteredDeliveryPersons.map((person) => [
      `${person.firstName} ${person.lastName}`,
      person.nic,
      person.age,
      person.vehicleType,
      person.address,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("delivery_persons.pdf");
  };

  const columns = [
    {
      title: "Deliver Person Id",
      dataIndex: "did",
      key: "did",
    },
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
      sorter: (a, b) => a.firstName.localeCompare(b.firstName),
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
      sorter: (a, b) => a.lastName.localeCompare(b.lastName),
    },
    {
      title: "NIC",
      dataIndex: "nic",
      key: "nic",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: "Vehicle Type",
      dataIndex: "vehicleType",
      key: "vehicleType",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this delivery person?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<PlusOutlined />} onClick={handleAdd}>
          Add Delivery Person
        </Button>
        <Input
          placeholder="Search delivery persons"
          prefix={<SearchOutlined />}
          onChange={handleSearch}
        />
        <Button icon={<FilePdfOutlined />} onClick={generatePDF}>
          Generate PDF
        </Button>
      </Space>
      <Table
        loading={loading}
        dataSource={filteredDeliveryPersons}
        columns={columns}
        rowKey="_id"
      />
      <Modal
        title={
          editingDeliveryPerson ? "Edit Delivery Person" : "Add Delivery Person"
        }
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: "Please input the first name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Please input the last name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please input the email" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="nic"
            label="NIC"
            rules={[{ required: true, message: "Please input the NIC!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="age"
            label="Age"
            rules={[{ required: true, message: "Please input the age!" }]}
          >
            <InputNumber min={18} max={65} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="vehicleType"
            label="Vehicle Type"
            rules={[
              { required: true, message: "Please select the vehicle type!" },
            ]}
          >
            <Select>
              <Option value="bike">Bike</Option>
              <Option value="wheel">Wheel</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please input the address!" }]}
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeliveryPersonManager;
