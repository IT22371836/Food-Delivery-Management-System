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
  Spin,
  Upload,
  Space,
  Checkbox,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
  Avatar,
  Badge,
  Tooltip
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
  FilePdfOutlined,
  FilterOutlined,
  StarOutlined,
  FireOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import { baseUrl } from "../../constants";
import jsPDF from "jspdf";
import "jspdf-autotable";
import './ItemManager.css';

const { Title, Text } = Typography;
const { Option } = Select;

const ItemManager = () => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingFood, setEditingFood] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dietaryFilters, setDietaryFilters] = useState({
    isVegetarian: false,
    isGlutenFree: false,
    isVegan: false,
  });
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFoods();
  }, []);

  useEffect(() => {
    let filtered = [...foods];
    
    if (searchTerm) {
      filtered = filtered.filter(
        (food) =>
          food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          food.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          food.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (activeCategory !== "all") {
      filtered = filtered.filter(food => food.category === activeCategory);
    }
    
    if (dietaryFilters.isVegetarian || dietaryFilters.isGlutenFree || dietaryFilters.isVegan) {
      filtered = filtered.filter(food => {
        return (
          (!dietaryFilters.isVegetarian || food.dietaryInfo.isVegetarian) &&
          (!dietaryFilters.isGlutenFree || food.dietaryInfo.isGlutenFree) &&
          (!dietaryFilters.isVegan || food.dietaryInfo.isVegan)
        );
      });
    }
    
    setFilteredFoods(filtered);
  }, [searchTerm, foods, activeCategory, dietaryFilters]);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/food/list`);
      setFoods(response.data.data);
      setFilteredFoods(response.data.data);
    } catch (error) {
      message.error("Failed to fetch food items");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFood(null);
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    form.setFieldsValue({
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      ingredients: food.ingredients,
      dietaryInfo: [
        ...(food.dietaryInfo.isVegetarian ? ['isVegetarian'] : []),
        ...(food.dietaryInfo.isGlutenFree ? ['isGlutenFree'] : []),
        ...(food.dietaryInfo.isVegan ? ['isVegan'] : [])
      ],
      isOnOffer: food.specialOffer.isOnOffer,
      offerDescription: food.specialOffer.offerDescription,
      discountPercentage: food.specialOffer.discountPercentage,
      image: food.image ? [{
        uid: '-1',
        name: 'current-image',
        status: 'done',
        url: `${baseUrl}/images/${food.image}`,
      }] : []
    });
    
    setFileList(food.image ? [{
      uid: '-1',
      name: 'current-image',
      status: 'done',
      url: `${baseUrl}/images/${food.image}`,
    }] : []);
    
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/food/remove/${id}`);
      message.success("Food item deleted successfully");
      fetchFoods();
    } catch (error) {
      message.error("Failed to delete food item");
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setUploading(true);

      const formData = new FormData();
      
      // Append all basic fields
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('price', values.price);
      formData.append('category', values.category);
      formData.append('ingredients', JSON.stringify(values.ingredients));
      
      // Handle dietary info
      formData.append('dietaryInfo', JSON.stringify({
        isVegetarian: values.dietaryInfo?.includes('isVegetarian') || false,
        isGlutenFree: values.dietaryInfo?.includes('isGlutenFree') || false,
        isVegan: values.dietaryInfo?.includes('isVegan') || false,
      }));
      
      // Handle special offer
      formData.append('specialOffer', JSON.stringify({
        isOnOffer: values.isOnOffer || false,
        offerDescription: values.offerDescription || '',
        discountPercentage: values.discountPercentage || 0,
      }));
      
      // Handle image upload
      if (values.image && values.image[0]?.originFileObj) {
        formData.append('image', values.image[0].originFileObj);
      } else if (editingFood && values.image && values.image.length > 0 && values.image[0].url) {
        // If editing and keeping the same image
        formData.append('image', editingFood.image);
      } else if (!values.image || values.image.length === 0) {
        // If no image is selected (including removing existing image)
        formData.append('image', '');
      }

      if (editingFood) {
        // For edit, use PUT request
        await axios.put(`${baseUrl}/api/food/update/${editingFood._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success("Food item updated successfully");
      } else {
        // For add, use POST request
        await axios.post(`${baseUrl}/api/food/add`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success("Food item added successfully");
      }
      
      setModalVisible(false);
      fetchFoods();
    } catch (error) {
      console.error("Error saving food item:", error);
      message.error(error.response?.data?.message || "Failed to save food item");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Food Items List", 14, 15);

    const tableColumn = [
      "Name",
      "Description",
      "Price",
      "Category",
      "Ingredients",
      "Dietary Info",
      "Special Offer",
    ];
    const tableRows = filteredFoods.map((food) => [
      food.name,
      food.description,
      food.price,
      food.category,
      food.ingredients.join(", "),
      Object.keys(food.dietaryInfo)
        .filter((key) => food.dietaryInfo[key])
        .join(", "),
      food.specialOffer.isOnOffer
        ? `${food.specialOffer.offerDescription} (${food.specialOffer.discountPercentage}% off)`
        : "No offer",
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("food_items.pdf");
  };

  const categories = [
    "all",
    "Salad",
    "Rolls",
    "Deserts",
    "Sandwich",
    "Cake",
    "Pure Veg",
    "Pasta",
    "Noodles"
  ];

  const getCategoryColor = (category) => {
    const colors = {
      'Salad': 'green',
      'Rolls': 'volcano',
      'Deserts': 'gold',
      'Sandwich': 'orange',
      'Cake': 'magenta',
      'Pure Veg': 'lime',
      'Pasta': 'geekblue',
      'Noodles': 'red'
    };
    return colors[category] || 'blue';
  };

  const columns = [
    {
      title: "Item",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <div className="item-cell">
          <Avatar 
            src={`${baseUrl}/images/${record.image}`} 
            shape="square" 
            size={64}
            className="food-avatar"
          />
          <div className="item-info">
            <Text strong>{name}</Text>
            <Text type="secondary" ellipsis className="item-description">
              {record.description}
            </Text>
            <div className="dietary-tags">
              {record.dietaryInfo.isVegetarian && <Tag color="green">Vegetarian</Tag>}
              {record.dietaryInfo.isGlutenFree && <Tag color="blue">Gluten-Free</Tag>}
              {record.dietaryInfo.isVegan && <Tag color="purple">Vegan</Tag>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      sorter: (a, b) => a.category.localeCompare(b.category),
      render: (category) => (
        <Tag color={getCategoryColor(category)}>
          {category}
        </Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price, record) => (
        <div>
          {record.specialOffer.isOnOffer ? (
            <>
              <Text delete type="secondary" style={{ fontSize: 12 }}>
                ${price.toFixed(2)}
              </Text>
              <Text strong style={{ color: '#f5222d', marginLeft: 8 }}>
                ${(price * (1 - record.specialOffer.discountPercentage / 100)).toFixed(2)}
              </Text>
            </>
          ) : (
            <Text strong>${price.toFixed(2)}</Text>
          )}
        </div>
      ),
    },
    {
      title: "Ingredients",
      dataIndex: "ingredients",
      key: "ingredients",
      render: (ingredients) => (
        <Tooltip 
          title={ingredients.join(", ")} 
          placement="topLeft"
          overlayClassName="ingredients-tooltip"
        >
          <div className="ingredients-preview">
            {ingredients.slice(0, 2).join(", ")}
            {ingredients.length > 2 && ` +${ingredients.length - 2} more`}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Offer",
      dataIndex: "specialOffer",
      key: "specialOffer",
      render: (specialOffer) =>
        specialOffer.isOnOffer ? (
          <Badge.Ribbon 
            text={`${specialOffer.discountPercentage}% OFF`} 
            color="red"
          >
            <div className="offer-cell">
              <FireOutlined style={{ color: '#f5222d' }} />
              <Text type="secondary">{specialOffer.offerDescription}</Text>
            </div>
          </Badge.Ribbon>
        ) : (
          <Text type="secondary">No offer</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            className="action-btn"
          />
          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
              className="action-btn"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <div className="item-manager-container">
      <Card className="header-card">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} className="page-title">
              <StarOutlined /> Menu Manager
            </Title>
            <Text type="secondary">Manage your restaurant's menu items</Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
              className="add-btn"
            >
              Add New Item
            </Button>
          </Col>
        </Row>
      </Card>

      <Card className="filters-card">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search items by name, description or category..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              allowClear
              className="search-input"
            />
          </Col>
          <Col>
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </Col>
          <Col>
            <Button 
              icon={<FilePdfOutlined />} 
              onClick={generatePDF}
              className="pdf-btn"
            >
              Export PDF
            </Button>
          </Col>
        </Row>

        {showFilters && (
          <div className="advanced-filters">
            <Divider orientation="left" plain>Categories</Divider>
            <div className="category-filters">
              {categories.map(cat => (
                <Button
                  key={cat}
                  type={activeCategory === cat ? 'primary' : 'default'}
                  onClick={() => setActiveCategory(cat)}
                  className="category-btn"
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </Button>
              ))}
            </div>

            <Divider orientation="left" plain>Dietary Restrictions</Divider>
            <Checkbox.Group 
              options={[
                { label: 'Vegetarian', value: 'isVegetarian' },
                { label: 'Gluten-Free', value: 'isGlutenFree' },
                { label: 'Vegan', value: 'isVegan' },
              ]}
              onChange={(checkedValues) => {
                setDietaryFilters({
                  isVegetarian: checkedValues.includes('isVegetarian'),
                  isGlutenFree: checkedValues.includes('isGlutenFree'),
                  isVegan: checkedValues.includes('isVegan'),
                });
              }}
            />
          </div>
        )}
      </Card>

      <Card className="items-table-card">
        <Spin spinning={loading}>
          <Table 
            dataSource={filteredFoods} 
            columns={columns} 
            rowKey="_id"
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} items`
            }}
            scroll={{ x: true }}
            className="items-table"
          />
        </Spin>
      </Card>

      <Modal
        title={
          <span className="modal-title">
            {editingFood ? (
              <>
                <EditOutlined /> Edit Menu Item
              </>
            ) : (
              <>
                <PlusOutlined /> Add New Menu Item
              </>
            )}
          </span>
        }
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading || uploading}
        width={800}
        className="item-modal"
        footer={[
          <Button key="back" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleModalOk}
            loading={loading || uploading}
          >
            {editingFood ? 'Update Item' : 'Add Item'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" className="item-form">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Item Name"
                rules={[{ required: true, message: "Please input the name!" }]}
              >
                <Input placeholder="e.g. Caesar Salad" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: "Please select the category!" }]}
              >
                <Select placeholder="Select category">
                  {categories.filter(c => c !== 'all').map(category => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please input the description!" }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Brief description of the item..."
              showCount 
              maxLength={200}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price ($)"
                rules={[{ required: true, message: "Please input the price!" }]}
              >
                <InputNumber 
                  min={0} 
                  step={0.01} 
                  style={{ width: '100%' }} 
                  formatter={value => `$ ${value}`}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="ingredients"
                label="Ingredients"
                rules={[{ required: true, message: "Please input the ingredients!" }]}
                tooltip={{
                  title: 'Separate ingredients with commas',
                  icon: <InfoCircleOutlined />
                }}
              >
                <Select
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="Enter ingredients (press enter after each)"
                  tokenSeparators={[',']}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="dietaryInfo" 
            label="Dietary Information"
            className="dietary-info"
          >
            <Checkbox.Group>
              <Row gutter={16}>
                <Col span={8}>
                  <Checkbox value="isVegetarian">
                    <Tag color="green">Vegetarian</Tag>
                  </Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="isGlutenFree">
                    <Tag color="blue">Gluten-Free</Tag>
                  </Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="isVegan">
                    <Tag color="purple">Vegan</Tag>
                  </Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Divider dashed />

          <Form.Item 
            name="isOnOffer" 
            valuePropName="checked"
            className="offer-checkbox"
          >
            <Checkbox>
              <Text strong>Special Offer</Text>
            </Checkbox>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.isOnOffer !== currentValues.isOnOffer
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("isOnOffer") ? (
                <div className="offer-fields">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="offerDescription"
                        label="Offer Description"
                        rules={[
                          {
                            required: true,
                            message: "Please input the offer description!",
                          },
                        ]}
                      >
                        <Input placeholder="e.g. Summer Special, Happy Hour, etc." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="discountPercentage"
                        label="Discount Percentage"
                        rules={[
                          {
                            required: true,
                            message: "Please input the discount percentage!",
                          },
                        ]}
                      >
                        <InputNumber 
                          min={0} 
                          max={100} 
                          style={{ width: '100%' }}
                          formatter={value => `${value}%`}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="image"
            label="Item Image"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              { required: !editingFood, message: "Please upload an image!" },
            ]}
            extra="Recommended size: 800x600px, JPG or PNG format"
          >
            <Upload 
              beforeUpload={() => false} 
              listType="picture-card"
              maxCount={1}
              className="image-upload"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              onRemove={() => setFileList([])}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ItemManager;