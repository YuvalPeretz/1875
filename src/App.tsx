import type React from "react"
import { useEffect, useState } from "react"
import { Table, Button, Modal, Form, Input, DatePicker, Select, InputNumber, Typography, Flex, Space, InputRef, Row, Col, Result, Spin, Layout, Card, Avatar } from "antd"
import useResponsive from "./hooks/useResponsive"
import { SearchOutlined, CalendarOutlined, DeleteOutlined, PlusOutlined, GoogleOutlined, UserOutlined, TeamOutlined, FormOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { ConfigProvider } from "antd"
import heIL from "antd/lib/locale/he_IL"
import usePeople from "./server/usePeople";
import { Timestamp } from "firebase/firestore";
import useEmail from "./jotai/useEmail";
import useAuth from "./hooks/useAuth";
import useAuthorization from "./server/useAuthorization";
import { List } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { Person } from "./utils/Types";
import icon from "./assets/Icon.jpg"

const { Title } = Typography

const { RangePicker } = DatePicker;

const { Option } = Select

const styles = {
  layout: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    background: '#001529',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    color: '#fff',
    margin: 0
  },
  content: {
    padding: '24px',
    margin: '24px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  card: {
    marginBottom: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  tableWrapper: {
    background: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  button: {
    borderRadius: '6px'
  },
  modal: {
    borderRadius: '8px'
  },
  formSection: {
    marginBottom: '32px',
    padding: '24px',
    background: '#fafafa',
    borderRadius: '8px'
  }
};


const LandingPage: React.FC = () => {
  const [isValid, setIsValid] = useState<null | boolean>(null)
  const [loginModal, setLoginModal] = useState(false)
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  let searchInput: InputRef | null = null;
  const [data, setData] = useState<any[]>()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { get, create } = usePeople()
  const { email } = useEmail()
  const { googleLogin, loading, logout } = useAuth()
  const { get: getAuth, update, hasWritePermissions } = useAuthorization()
  const [authedUsers, setAuthedUsers] = useState<{ id: string, emails: string[] }[] | null>(null)

  const { breakpointCategory } = useResponsive()
  const isMobile = breakpointCategory === "smallMobile" || breakpointCategory === "mobile"

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => {
            confirm();
            setSearchText(selectedKeys[0]);
            setSearchedColumn(dataIndex);
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              setSearchText('');
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button type="link" size="small" onClick={() => close()}>
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string, record: any) => {
      const recordValue = record[dataIndex];
      if (Array.isArray(recordValue)) {
        return recordValue.join(', ').toLowerCase().includes(value.toLowerCase());
      }
      return recordValue
        ? recordValue.toString().toLowerCase().includes(value.toLowerCase())
        : '';
    },
    onOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => searchInput?.select(), 100);
      }
    },
    render: (text: any) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const getColumnDateFilterProps = (dataIndex: string) => ({
    filterDropdown: ({
      setSelectedKeys,
      confirm,
      clearFilters,
    }: any) => (
      <div style={{ padding: 8 }}>
        <RangePicker
          onChange={(_, dateStrings) => {
            setSelectedKeys(
              dateStrings && dateStrings[0] && dateStrings[1] ? [dateStrings] : []
            );
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Filter
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              confirm()
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <CalendarOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string[], record: any) => {
      if (!record[dataIndex]) return false;
      // Convert the record's date (assumed to be a Date object) to a timestamp.
      const recordTime = record[dataIndex].getTime();
      // Create timestamps from the selected date strings.
      // Setting the start of day for the first date and the end of day for the second date.
      const startTime = new Date(value[0]).setHours(0, 0, 0, 0);
      const endTime = new Date(value[1]).setHours(23, 59, 59, 999);
      return recordTime >= startTime && recordTime <= endTime;
    },
  });

  const columns = [
    {
      title: "חותמת זמן",
      dataIndex: "timestamp",
      key: "timestamp",
      ...getColumnDateFilterProps("timestamp"),
      sorter: (a: Person, b: Person) => {
        try {
          return a.timestamp.getTime() - b.timestamp.getTime();
        } catch (error) {
          console.log(a.timestamp, b.timestamp instanceof Date);
        }
      },
      render: (timestamp: Date) => timestamp.toLocaleDateString(),
    },
    {
      title: "שם פרטי",
      dataIndex: "firstName",
      key: "firstName",
      ...getColumnSearchProps("firstName"),
      sorter: (a: Person, b: Person) => a.firstName.localeCompare(b.firstName),
    },
    {
      title: "שם משפחה",
      dataIndex: "lastName",
      key: "lastName",
      ...getColumnSearchProps("lastName"),
      sorter: (a: Person, b: Person) => a.lastName.localeCompare(b.lastName),
    },
    {
      title: "פלוגה",
      dataIndex: "company",
      key: "company",
      ...getColumnSearchProps("company"),
      sorter: (a: Person, b: Person) => Number(a.company) - Number(b.company),
    },
    {
      title: "כתובת מייל",
      dataIndex: "email",
      key: "email",
      ...getColumnSearchProps("email"),
      sorter: (a: Person, b: Person) => a.email.localeCompare(b.email),
    },
    {
      title: "מספר טלפון",
      dataIndex: "phone",
      key: "phone",
      ...getColumnSearchProps("phone"),
      sorter: (a: Person, b: Person) => a.phone.localeCompare(b.phone),
    },
    {
      title: "כתובת מגורים מלאה",
      dataIndex: "address",
      key: "address",
      ...getColumnSearchProps("address"),
      sorter: (a: Person, b: Person) => a.address.localeCompare(b.address),
    },
    {
      title: "תאריך לידה",
      dataIndex: "birthDate",
      key: "birthDate",
      ...getColumnDateFilterProps("birthDate"),
      sorter: (a: Person, b: Person) =>
        a.birthDate.getTime() - b.birthDate.getTime(),
      render: (birthDate: Date) => birthDate.toLocaleDateString(),
    },
    {
      title: "באיזה תחום אתה עוסק?",
      dataIndex: "occupation",
      key: "occupation",
      ...getColumnSearchProps("occupation"),
      sorter: (a: Person, b: Person) => a.occupation.localeCompare(b.occupation),
    },
    {
      title: "הגדרת תפקיד",
      dataIndex: "roleDefinition",
      key: "roleDefinition",
      ...getColumnSearchProps("roleDefinition"),
      sorter: (a: Person, b: Person) => a.roleDefinition.localeCompare(b.roleDefinition),
    },
    {
      title: "מקום עבודה",
      dataIndex: "workplace",
      key: "workplace",
      ...getColumnSearchProps("workplace"),
      sorter: (a: Person, b: Person) => a.workplace.localeCompare(b.workplace),
    },
    {
      title: "באיזה תחום הבת / בן זוג עוסק/ת?",
      dataIndex: "spouseOccupation",
      key: "spouseOccupation",
      ...getColumnSearchProps("spouseOccupation"),
      sorter: (a: Person, b: Person) =>
        (a.spouseOccupation || "").localeCompare(b.spouseOccupation || ""),
    },
    {
      title: "יש לך תחביבים / תחומי עניין?",
      dataIndex: "hobbies",
      key: "hobbies",
      ...getColumnSearchProps("hobbies"),
      sorter: (a: Person, b: Person) =>
        (a.hobbies ? a.hobbies.join(", ") : "").localeCompare(
          b.hobbies ? b.hobbies.join(", ") : ""
        ),
      render: (hobbies: string[]) => hobbies?.join(", "),
    },
    {
      title: "האם יש ילדים? אם כן, כמה?",
      dataIndex: "childrenCount",
      key: "childrenCount",
      ...getColumnSearchProps("childrenCount"),
      sorter: (a: Person, b: Person) => a.childrenCount - b.childrenCount,
    },
    {
      title: "גילאי הילדים (אפשר לסמן כמה)",
      dataIndex: "childrenAges",
      key: "childrenAges",
      ...getColumnSearchProps("childrenAges"),
      sorter: (a: Person, b: Person) =>
        (a.childrenAges ? a.childrenAges.join(", ") : "").localeCompare(
          b.childrenAges ? b.childrenAges.join(", ") : ""
        ),
      render: (ages: string[]) => ages?.join(", "),
    },
    {
      title: "נשמח לשמוע מה הניע אותך להתנדב חזרה מפטור",
      dataIndex: "motivation",
      key: "motivation",
      ...getColumnSearchProps("motivation"),
      sorter: (a: Person, b: Person) => a.motivation.localeCompare(b.motivation),
    },
    {
      title: "מה הציפיות שלך מהשירות בגדוד? מה חשוב לך להשיג / לחוות?",
      dataIndex: "expectations",
      key: "expectations",
      ellipsis: true,
      ...getColumnSearchProps("expectations"),
      sorter: (a: Person, b: Person) => a.expectations.localeCompare(b.expectations),
    },
    {
      title: "האם יש צרכים / אתגרים מיוחדים שכדאי שנכיר?",
      dataIndex: "specialNeeds",
      key: "specialNeeds",
      ...getColumnSearchProps("specialNeeds"),
      sorter: (a: Person, b: Person) =>
        (a.specialNeeds || "").localeCompare(b.specialNeeds || ""),
    },
    {
      title:
        "האם תרצה להשתתף בפעילות פנאי עם חיילי הפלוגה מחוץ לימי המילואים?",
      dataIndex: "participationInLeisure",
      key: "participationInLeisure",
      filters: [
        { text: "כן", value: "כן" },
        { text: "לא", value: "לא" },
        { text: "אולי", value: "אולי" },
      ],
      onFilter: (value: string, record: any) =>
        record.participationInLeisure === value,
      sorter: (a: Person, b: Person) =>
        a.participationInLeisure.localeCompare(b.participationInLeisure),
    },
    {
      title:
        "תרצה לקחת חלק פעיל בהובלת הלכידות וחיזוק הקשרים הבין אישיים בפלוגה שלך?",
      dataIndex: "leadershipParticipation",
      key: "leadershipParticipation",
      filters: [
        { text: "כן", value: "כן" },
        { text: "לא", value: "לא" },
        { text: "אולי", value: "אולי" },
      ],
      onFilter: (value: string, record: any) =>
        record.leadershipParticipation === value,
      sorter: (a: Person, b: Person) =>
        a.leadershipParticipation.localeCompare(b.leadershipParticipation),
    },
    {
      title:
        "האם יש תחום בו תרצה לסייע לחיילי הפלוגה / להוביל פעילות / לתרום?",
      dataIndex: "supportArea",
      key: "supportArea",
      ...getColumnSearchProps("supportArea"),
      sorter: (a: Person, b: Person) => a.supportArea.localeCompare(b.supportArea),
    },
    {
      title:
        "האם יש נכס ברשותך שיכול לסייע לערבי פלוגה / גדוד (בית, אולם, בריכה...)",
      dataIndex: "availableAssets",
      key: "availableAssets",
      ...getColumnSearchProps("availableAssets"),
      sorter: (a: Person, b: Person) => a.availableAssets.localeCompare(b.availableAssets),
    },
  ];

  const showModal = () => {
    setIsModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      const newEntry = {
        ...values,
        // Convert date inputs to Firestore Timestamp
        timestamp: Timestamp.fromDate(new Date()),
        birthDate: values.birthDate ? Timestamp.fromDate(values.birthDate.toDate()) : null,
        key: Date.now(),
      };

      try {
        await create(newEntry);
        const updatedPeople = await get();
        setData(updatedPeople);
        setIsModalVisible(false);
        form.resetFields();
      } catch (error) {
        console.error("Failed to add document:", error);
      }
    });
  };
  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  async function validateEmail() {
    const authList = await getAuth()
    setIsValid(Boolean(authList && email && authList[0].emails.some((_email) => _email === email)))
    setAuthedUsers(authList)
  }

  async function onAddingUser(value: string) {
    if (value && !authedUsers?.flatMap(({ emails }) => emails).includes(value)) {
      const emails = authedUsers?.flatMap(({ emails }) => emails) || [];
      const newList = [...emails, value];
      await update(newList);
      await validateEmail();
    }
  }

  useEffect(() => {
    if (email) {
      setLoginModal(false)
      validateEmail()
    }
    else setLoginModal(true)
  }, [email])

  useEffect(() => {
    if (isValid)
      get().then(people => setData(people))
  }, [isValid])

  useEffect(() => {
    const checkPermissions = async () => {
      if (window.location.pathname === "/shrek") {
        const hasPermission = await hasWritePermissions();
        if (!hasPermission) {
          window.location.replace("/");
        }
      }
    };

    checkPermissions();
  }, [window.location.pathname])


  if (window.location.pathname === "/shrek") {
    return (
      <ConfigProvider direction="rtl" locale={heIL}>
        <Layout style={styles.layout}>
          <Header style={styles.header}>
            <Title level={3} style={styles.headerTitle}>ניהול הרשאות משתמשים</Title>
          </Header>
          <Content style={styles.content}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.Search
                placeholder="הוסף אימייל חדש"
                enterButton={<Button type="primary" icon={<PlusOutlined />}>הוספה</Button>}
                onSearch={onAddingUser}
                size="large"
                style={{ maxWidth: 400, marginBottom: 24 }}
              />
              <Card title="משתמשים מורשים" style={styles.card}>
                <List
                  style={{ overflow: "auto" }}
                  dataSource={authedUsers?.flatMap(({ emails }) => emails)}
                  renderItem={email => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={email}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Space>
          </Content>
        </Layout>
      </ConfigProvider>
    );
  }
  else return (
    <ConfigProvider direction="rtl" locale={heIL}>
      {loading && isValid === null ? <Spin fullscreen tip="טוען" /> :

        <>
          {email ?
            !isValid ?
              <Result
                status="403"
                title="403"
                subTitle="אופס, נראה שאין לך הרשאה"
                extra={<Button type="primary" onClick={logout}>התנתק</Button>}
              />
              :
              <Layout style={styles.layout}>
                <Header style={styles.header}>
                  <Title level={3} style={styles.headerTitle}>
                    <Avatar src={icon} /> דף קשר גדוד 1875
                  </Title>
                  <Space>
                    <Button
                      type="primary"
                      onClick={showModal}
                      icon={<PlusOutlined />}
                      size="large"
                      style={styles.button}
                    >
                      הוסף חייל חדש
                    </Button>
                  </Space>
                </Header>
                <Content style={styles.content}>
                  <Table
                    loading={!data}
                    rowKey="key"                  // ensures each row is uniquely identified
                    bordered                      // adds borders for clarity
                    columns={columns as any}
                    dataSource={data || []}
                    pagination={isMobile ? { simple: true } : {}}
                    size="small"
                    scroll={{ x: "max-content" }} // enables horizontal scrolling if needed
                  />
                </Content>
                <Modal
                  title={<><FormOutlined /> הוספת חייל חדש</>}
                  open={isModalVisible}
                  onOk={handleOk}
                  onCancel={handleCancel}
                  width={isMobile ? "100%" : "80%"}
                  style={{ ...styles.modal, top: isMobile ? 0 : 20 }}
                  centered            // centers the modal vertically
                  destroyOnClose      // clears modal content on close for better performance
                >
                  <Form form={form} layout="vertical">
                    <Card title="פרטים אישיים" style={styles.formSection}>
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="firstName" label="שם פרטי" rules={[{ required: true, message: "נא להזין שם פרטי" }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="lastName" label="שם משפחה" rules={[{ required: true, message: "נא להזין שם משפחה" }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="company" label="פלוגה" rules={[{ required: true, message: "נא להזין פלוגה" }]}>
                            <InputNumber style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="email" label="כתובת מייל" rules={[{ required: true, type: "email", message: "נא להזין כתובת מייל תקינה" }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="phone" label="מספר טלפון" rules={[{ required: true, message: "נא להזין מספר טלפון" }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="address" label="כתובת מגורים מלאה" rules={[{ required: true, message: "נא להזין כתובת מגורים" }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="birthDate" label="תאריך לידה" rules={[{ required: true, message: "נא לבחור תאריך לידה" }]}>
                            <DatePicker style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="occupation" label="באיזה תחום אתה עוסק?" rules={[{ required: true, message: "נא להזין תחום עיסוק" }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="roleDefinition" label="הגדרת תפקיד" rules={[{ required: true, message: "נא להזין הגדרת תפקיד" }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="workplace" label="מקום עבודה" rules={[{ required: true, message: "נא להזין מקום עבודה" }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="spouseOccupation" label="באיזה תחום הבת / בן זוג עוסק/ת?">
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Form.Item name="hobbies" label="יש לך תחביבים / תחומי עניין?">
                            <Select mode="tags" style={{ width: "100%" }} placeholder="בחר או הזן תחביבים">
                              <Option value="ספורט">ספורט</Option>
                              <Option value="קריאה">קריאה</Option>
                              <Option value="מוזיקה">מוזיקה</Option>
                              <Option value="טיולים">טיולים</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Form.Item label="גילאי הילדים (ניתן להוסיף מספר שדות):">
                          <Form.List name="children">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map((field, index) => (
                                  <Flex vertical key={field.key}>
                                    <Typography.Text ellipsis>{`גיל ילד ${index + 1}`}</Typography.Text>
                                    <Space style={{ paddingBottom: 10 }}>
                                      <Form.Item
                                        noStyle
                                        {...field}
                                        rules={[{ required: true, message: 'נא לבחור טווח גיל' }]}
                                      >
                                        <Select placeholder="בחר טווח גיל" style={{ width: "100%" }}>
                                          <Option value="0-2">0-2</Option>
                                          <Option value="3-5">3-5</Option>
                                          <Option value="6-12">6-12</Option>
                                          <Option value="13-18">13-18</Option>
                                          <Option value="18+">18+</Option>
                                        </Select>
                                      </Form.Item>
                                      <Button onClick={() => remove(field.name)} danger icon={<DeleteOutlined />}>
                                        הסר
                                      </Button>
                                    </Space>
                                  </Flex>
                                ))}
                                <Form.Item>
                                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    הוסף ילד
                                  </Button>
                                </Form.Item>
                              </>
                            )}
                          </Form.List>
                        </Form.Item>
                        <Col xs={24}>
                          <Form.Item name="motivation" label="נשמח לשמוע מה הניע אותך להתנדב חזרה מפטור" rules={[{ required: true, message: "נא להזין מוטיבציה" }]}>
                            <Input.TextArea />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item name="expectations" label="מה הציפיות שלך מהשירות בגדוד? מה חשוב לך להשיג / לחוות?" rules={[{ required: true, message: "נא להזין ציפיות" }]}>
                            <Input.TextArea />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item name="specialNeeds" label="האם יש צרכים / אתגרים מיוחדים שכדאי שנכיר?">
                            <Input.TextArea />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item name="participationInLeisure" label="האם תרצה להשתתף בפעילות פנאי עם חיילי הפלוגה מחוץ לימי המילואים?">
                            <Select>
                              <Option value="כן">כן</Option>
                              <Option value="לא">לא</Option>
                              <Option value="אולי">אולי</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item name="leadershipParticipation" label="תרצה לקחת חלק פעיל בהובלת הלכידות וחיזוק הקשרים הבין אישיים בפלוגה שלך?">
                            <Select>
                              <Option value="כן">כן</Option>
                              <Option value="לא">לא</Option>
                              <Option value="אולי">אולי</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item name="supportArea" label="האם יש תחום בו תרצה לסייע לחיילי הפלוגה / להוביל פעילות / לתרום?">
                            <Input.TextArea />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item name="availableAssets" label="האם יש נכס ברשותך שיכול לסייע לערבי פלוגה / גדוד (בית, אולם, בריכה...)">
                            <Input.TextArea />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  </Form>
                </Modal>
              </Layout> : null
          }


          <Modal
            closable={false}
            title="התחברות למערכת"
            open={!loading && loginModal}
            centered
            destroyOnClose
            footer={null}
          >
            <Flex justify="center">
              <Button onClick={googleLogin} icon={<GoogleOutlined />}>
                <Typography.Text>התחברות עם גוגל</Typography.Text>
              </Button>
            </Flex>
          </Modal>
        </>
      }

    </ConfigProvider>
  )
}

export default LandingPage