import type React from "react"
import { useEffect, useState } from "react"
import { Button, Modal, Form, Input, DatePicker, Select, InputNumber, Typography, Flex, Space, Row, Col, Result, Spin, Layout, Card, Avatar, Popconfirm } from "antd"
import useResponsive from "./hooks/useResponsive"
import { DeleteOutlined, PlusOutlined, GoogleOutlined, UserOutlined, FormOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
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

const translations = {
  "timestamp": "חותמת זמן",
  "firstName": "שם פרטי",
  "lastName": "שם משפחה",
  "company": "פלוגה",
  "email": "כתובת מייל",
  "phone": "מספר טלפון",
  "address": "כתובת מגורים מלאה",
  "birthDate": "תאריך לידה",
  "occupation": "באיזה תחום אתה עוסק?",
  "roleDefinition": "הגדרת תפקיד",
  "workplace": "מקום עבודה",
  "spouseOccupation": "באיזה תחום הבת / בן זוג עוסק/ת?",
  "hobbies": "יש לך תחביבים / תחומי עניין?",
  "leadershipParticipation": "תרצה לקחת חלק פעיל בהובלת הלכידות וחיזוק הקשרים הבין אישיים בפלוגה שלך?",
  "availableAssets": "האם יש נכס ברשותך שיכול לסייע לערבי פלוגה / גדוד (בית, אולם, בריכה...)"
};

const LandingPage: React.FC = () => {
  const [isValid, setIsValid] = useState<null | boolean>(null)
  const [loginModal, setLoginModal] = useState(false)
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<any[]>()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { get, create } = usePeople()
  const { email } = useEmail()
  const { googleLogin, loading, logout } = useAuth()
  const { get: getAuth, update, hasWritePermissions } = useAuthorization()
  const [authedUsers, setAuthedUsers] = useState<{ id: string, emails: string[] }[] | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const { breakpointCategory } = useResponsive()
  const isMobile = breakpointCategory === "smallMobile" || breakpointCategory === "mobile"

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

  async function onRemoveUser(value: string) {
    if (value && authedUsers?.flatMap(({ emails }) => emails).includes(value)) {
      const emails = authedUsers?.flatMap(({ emails }) => emails) || [];
      const newList = emails.filter(email => email !== value);
      await update(newList);
      await validateEmail();
    }
  }

  function getFilteredValues(person: Person) {
    if (!searchText) return null;

    const filteredEntries = Object.entries(person)
      .filter(([key]) => !['id', 'timestamp'].includes(key) && key in translations)
      .map(([key, value]) => {
        const label = translations[key as keyof typeof translations];
        //@ts-ignore
        let displayValue: React.ReactNode = value;

        // Handle special value formatting
        if (value instanceof Timestamp) {
          displayValue = new Date(value.toDate()).toLocaleDateString('he-IL');
        } else if (value instanceof Date) {
          displayValue = value.toLocaleDateString('he-IL');
        } else if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value);
        }

        return { label, value: displayValue };
      })
      .filter(({ label, value }) =>
        value?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
        label?.toLowerCase().includes(searchText.toLowerCase())
      );

    if (filteredEntries.length === 0) return null;

    return (
      <List
        size="small"
        dataSource={filteredEntries}
        renderItem={({ label, value }) => (
          <List.Item style={{ padding: 0, borderBlockEnd: 0 }}>
            <List.Item.Meta
              title={<Typography.Text strong>{label}</Typography.Text>}
              description={<Typography.Text type="secondary">{value}</Typography.Text>}
            />
          </List.Item>
        )}
      />
    );
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
      if (window.location.pathname === "/shrek" && email) {
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
                    <List.Item extra={<Popconfirm title="למחוק מייל?" onConfirm={() => onRemoveUser(email)}>
                      <Button size="small" danger type="primary" icon={<DeleteOutlined />} />
                    </Popconfirm>}>
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
                </Header>
                <Content style={styles.content}>
                  <Flex vertical gap={10}>
                    <Space>
                      <Input style={{ maxWidth: 300 }} onChange={e => setSearchText(e.target.value)} allowClear placeholder="חפש" prefix={<SearchOutlined />} />
                      <Button
                        type="primary"
                        onClick={showModal}
                        icon={<PlusOutlined />}
                        style={styles.button}
                      >
                        הוסף חייל חדש
                      </Button>
                    </Space>
                    <Space wrap>
                      {data?.filter(person => JSON.stringify(Object.values(person)).toLocaleLowerCase().includes(searchText.toLocaleLowerCase()))?.map((person: Person) => <Card
                        title={`${person.firstName} ${person.lastName}`}
                        actions={[<EyeOutlined
                          key="view"
                          onClick={() => setSelectedPerson(person)}
                        />]}
                        style={{ width: isMobile ? '100%' : 300 }}
                      >
                        <Flex vertical gap={8}>
                          <Typography.Text strong type="secondary">{translations["company"]}: {person.company}</Typography.Text>
                          <Typography.Link href={`mailto:${person.email}`}>{person.email}</Typography.Link>
                          <Typography.Text>{person.phone}</Typography.Text>
                          {getFilteredValues(person)}
                        </Flex>
                      </Card>)}
                    </Space>
                  </Flex>
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
                        {/* <Form.Item label="גילאי הילדים (ניתן להוסיף מספר שדות):">
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
                        </Form.Item> */}
                        {/* <Col xs={24}>
                          <Form.Item name="motivation" label="נשמח לשמוע מה הניע אותך להתנדב חזרה מפטור" rules={[{ required: true, message: "נא להזין מוטיבציה" }]}>
                            <Input.TextArea />
                          </Form.Item>
                        </Col> */}
                        {/* <Col xs={24}>
                          <Form.Item name="expectations" label="מה הציפיות שלך מהשירות בגדוד? מה חשוב לך להשיג / לחוות?" rules={[{ required: true, message: "נא להזין ציפיות" }]}>
                            <Input.TextArea />
                          </Form.Item>
                        </Col> */}
                        {/* <Col xs={24}>
                          <Form.Item name="specialNeeds" label="האם יש צרכים / אתגרים מיוחדים שכדאי שנכיר?">
                            <Input.TextArea />
                          </Form.Item>
                        </Col> */}
                        {/* <Col xs={24} sm={12}>
                          <Form.Item name="participationInLeisure" label="האם תרצה להשתתף בפעילות פנאי עם חיילי הפלוגה מחוץ לימי המילואים?">
                            <Select>
                              <Option value="כן">כן</Option>
                              <Option value="לא">לא</Option>
                              <Option value="אולי">אולי</Option>
                            </Select>
                          </Form.Item>
                        </Col> */}
                        <Col xs={24} sm={12}>
                          <Form.Item name="leadershipParticipation" label="תרצה לקחת חלק פעיל בהובלת הלכידות וחיזוק הקשרים הבין אישיים בפלוגה שלך?">
                            <Select>
                              <Option value="כן">כן</Option>
                              <Option value="לא">לא</Option>
                              <Option value="אולי">אולי</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        {/* <Col xs={24}>
                          <Form.Item name="supportArea" label="האם יש תחום בו תרצה לסייע לחיילי הפלוגה / להוביל פעילות / לתרום?">
                            <Input.TextArea />
                          </Form.Item>
                        </Col> */}
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

          <Modal
            title={`פרטים מלאים - ${selectedPerson?.firstName} ${selectedPerson?.lastName}`}
            open={!!selectedPerson}
            onCancel={() => setSelectedPerson(null)}
            footer={null}
            width={800}
          >
            {selectedPerson && (
              <List
                itemLayout="horizontal"
                dataSource={Object.entries(selectedPerson).filter(([key]) => !['id', 'timestamp'].includes(key) && key in translations)}
                renderItem={([key, value]) => {
                  const label = translations[key as keyof typeof translations] || key;
                  //@ts-ignore
                  let displayValue: React.ReactNode = value;

                  if (value instanceof Timestamp) {
                    displayValue = new Date(value.toDate()).toLocaleDateString('he-IL');
                  } else if (value instanceof Date) {
                    displayValue = value.toLocaleDateString('he-IL');
                  } else if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                  } else if (typeof value === 'object' && value !== null) {
                    displayValue = JSON.stringify(value);
                  }

                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={<Typography.Text strong>{label}</Typography.Text>}
                        description={<Typography.Text>{displayValue || 'לא צוין'}</Typography.Text>}
                        style={{ width: '100%' }}
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Modal>
        </>
      }

    </ConfigProvider>
  )
}

export default LandingPage