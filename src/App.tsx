import type React from "react";
import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  Flex,
  Space,
  Row,
  Col,
  Result,
  Spin,
  Layout,
  Card,
  Avatar,
  Popconfirm,
  notification,
  Select,
} from "antd";
import useResponsive from "./hooks/useResponsive";
import {
  DeleteOutlined,
  PlusOutlined,
  GoogleOutlined,
  UserOutlined,
  FormOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ConfigProvider } from "antd";
import heIL from "antd/lib/locale/he_IL";
import usePeople from "./server/usePeople";
import { Timestamp } from "firebase/firestore";
import useUser from "./jotai/useUser";
import useAuth from "./hooks/useAuth";
import useAuthorization from "./server/useAuthorization";
import { List } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { Person } from "./utils/Types";
import icon from "./assets/Icon.jpg";
import useRequests from "./server/useRequests";
import '@ant-design/v5-patch-for-react-19';

const { Title } = Typography;

const styles = {
  layout: {
    minHeight: "100vh",
    background: "#f5f5f5",
  },
  header: {
    background: "#001529",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    margin: 0,
  },
  content: {
    padding: "24px",
    margin: "24px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  card: {
    marginBottom: "24px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  tableWrapper: {
    background: "#fff",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  button: {
    borderRadius: "6px",
  },
  modal: {
    borderRadius: "8px",
  },
  formSection: {
    marginBottom: "32px",
    padding: "24px",
    background: "#fafafa",
    borderRadius: "8px",
  },
};

const translations = {
  timestamp: "חותמת זמן",
  firstName: "שם פרטי",
  lastName: "שם משפחה",
  company: "פלוגה",
  email: "כתובת מייל",
  phone: "מספר טלפון",
  // address: "כתובת מגורים מלאה",
  // birthDate: "תאריך לידה",
  occupation: "עיסוק",
  // roleDefinition: "הגדרת תפקיד",
  // workplace: "מקום עבודה",
  // spouseOccupation: "באיזה תחום הבת / בן זוג עוסק/ת?",
  // hobbies: "יש לך תחביבים / תחומי עניין?",
  // leadershipParticipation:
  //   "תרצה לקחת חלק פעיל בהובלת הלכידות וחיזוק הקשרים הבין אישיים בפלוגה שלך?",
  // availableAssets:
  //   "האם יש נכס ברשותך שיכול לסייע לערבי פלוגה / גדוד (בית, אולם, בריכה...)",
};

const LandingPage: React.FC = () => {
  const [isValid, setIsValid] = useState<null | boolean>(null);
  const [loginModal, setLoginModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState<any[]>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { get, create } = usePeople();
  const { create: sendJoinRequest, remove: deleteJoinRequest, getAll: getAllJoinRequests } =
    useRequests();
  const { user } = useUser();
  const { googleLogin, loading, logout } = useAuth();
  const { get: getAuth, update: updateAuthedUsers, hasWritePermissions } = useAuthorization();
  const [authedUsers, setAuthedUsers] = useState<
    { id: string; emails: string[] }[] | null
  >(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>("");

  const { breakpointCategory } = useResponsive();
  const isMobile =
    breakpointCategory === "smallMobile" || breakpointCategory === "mobile";

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      const newEntry = {
        ...values,
        // Convert date inputs to Firestore Timestamp
        timestamp: Timestamp.fromDate(new Date()),
        birthDate: values.birthDate
          ? Timestamp.fromDate(values.birthDate.toDate())
          : null,
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
    setIsModalVisible(false);
    form.resetFields();
  };

  async function validateEmail() {
    const authList = await getAuth();
    setIsValid(
      Boolean(
        authList &&
        user?.email &&
        authList[0].emails.some((_email) => _email === user?.email)
      )
    );
    setAuthedUsers(authList);
  }

  /** add a new email to the auth-list */
  async function onAddingUser(value: string) {
    if (!value) return;

    // re-fetch the very latest auth list
    const freshList = await getAuth();
    const existingEmails = freshList?.flatMap((u) => u.emails) || [];
    if (existingEmails?.includes(value)) return;

    const newList = [...existingEmails, value];

    await updateAuthedUsers(newList);
    await validateEmail();
  }
  async function onRemoveUser(value: string) {
    if (
      value &&
      authedUsers?.flatMap(({ emails }) => emails).includes(value)
    ) {
      const emails = authedUsers?.flatMap(({ emails }) => emails) || [];
      const newList = emails.filter((email) => email !== value);
      await updateAuthedUsers(newList);
      await validateEmail();
    }
  }

  function getFilteredValues(person: Person) {
    if (!searchText) return null;

    const filteredEntries = Object.entries(person)
      .filter(
        ([key]) =>
          !["id", "timestamp"].includes(key) && key in translations
      )
      .map(([key, value]) => {
        const label = translations[key as keyof typeof translations];
        //@ts-ignore
        let displayValue: React.ReactNode = value;

        // Handle special value formatting
        if (value instanceof Timestamp) {
          displayValue = new Date(value.toDate()).toLocaleDateString(
            "he-IL"
          );
        } else if (value instanceof Date) {
          displayValue = value.toLocaleDateString("he-IL");
        } else if (Array.isArray(value)) {
          displayValue = value.join(", ");
        } else if (typeof value === "object" && value !== null) {
          displayValue = JSON.stringify(value);
        }

        return { label, value: displayValue };
      })
      .filter(
        ({ label, value }) =>
          value
            ?.toString()
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
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
              title={
                <Typography.Text strong>
                  {label}
                </Typography.Text>
              }
              description={
                <Typography.Text type="secondary">
                  {value}
                </Typography.Text>
              }
            />
          </List.Item>
        )}
      />
    );
  }

  useEffect(() => {
    if (user?.email) {
      setLoginModal(false);
      validateEmail();
    } else setLoginModal(true);
  }, [user?.email]);

  useEffect(() => {
    if (isValid) get().then((people) => setData(people));
  }, [isValid]);

  useEffect(() => {
    if (user) {
      validateEmail()
      hasWritePermissions().then(hasPermission => {
        if (hasPermission && window.location.pathname === "/shrek") {
          getAllJoinRequests().then((requests) =>
            requests.forEach(({ email, name, id }) =>
              notification.info({
                pauseOnHover: true,
                showProgress: true,
                duration: 5,
                message: `${name} ביקש להצטרף לרשימה עם המייל ${email}`,
                actions: (
                  <Space>
                    <Button onClick={() => deleteJoinRequest(id!)}>
                      ביטול
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => onAddingUser(email).then(() => deleteJoinRequest(id!))}
                    >
                      אישור
                    </Button>
                  </Space>
                ),
              })
            )
          );
        }
      });
    }
  }, [user, window.location.pathname]);


  if (loading || isValid === null) {
    return <Spin fullscreen tip="טוען" />;
  }


  if (!user) {
    return (
      <ConfigProvider direction="rtl" locale={heIL}>
        <Modal
          closable={false}
          title="התחברות למערכת"
          open={!loading && loginModal}
          centered
          destroyOnHidden
          footer={null}
        >
          <Flex justify="center">
            <Button onClick={googleLogin} icon={<GoogleOutlined />}>
              התחברות עם גוגל
            </Button>
          </Flex>
        </Modal>
      </ConfigProvider>
    );
  }

  if (!isValid) {
    return (
      <ConfigProvider direction="rtl" locale={heIL}>
        <Result
          status="403"
          title="403"
          subTitle="אופס, נראה שאין לך הרשאה"
          extra={
            <Flex gap={8} justify="center">
              <Button onClick={logout}>התנתק</Button>
              <Button
                type="primary"
                onClick={() =>
                  sendJoinRequest({
                    email: user.email!,
                    name: user.displayName || "",
                  })
                }
              >
                בקשת הרשאה
              </Button>
            </Flex>
          }
        />
      </ConfigProvider>
    );
  }

  if (window.location.pathname === "/shrek") {
    return (
      <ConfigProvider direction="rtl" locale={heIL}>
        <Layout style={styles.layout}>
          <Header style={styles.header}>
            <Title level={3} style={styles.headerTitle}>
              ניהול הרשאות משתמשים
            </Title>
            <Button onClick={() => window.location.pathname = "/"}>
              חזור
            </Button>
          </Header>
          <Content style={styles.content}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Input.Search
                placeholder="הוסף אימייל חדש"
                enterButton={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                  >
                    הוספה
                  </Button>
                }
                onSearch={onAddingUser}
                size="large"
                style={{ maxWidth: 400, marginBottom: 24 }}
              />
              <Card title="משתמשים מורשים" style={styles.card}>
                <List
                  style={{ overflow: "auto" }}
                  dataSource={authedUsers?.filter(({ emails }) => emails)?.flatMap(
                    ({ emails }) => emails
                  )}
                  renderItem={(email) => (
                    <List.Item
                      extra={
                        <Popconfirm
                          title="למחוק מייל?"
                          onConfirm={() =>
                            onRemoveUser(email)
                          }
                        >
                          <Button
                            size="small"
                            danger
                            type="primary"
                            icon={
                              <DeleteOutlined />
                            }
                          />
                        </Popconfirm>
                      }
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={<UserOutlined />}
                          />
                        }
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
  } else
    return (
      <ConfigProvider direction="rtl" locale={heIL}>
        {loading && isValid === null ? (
          <Spin fullscreen tip="טוען" />
        ) : (
          <>
            {user ? (
              (
                <Layout style={styles.layout}>
                  <Header style={styles.header}>
                    <Flex justify="space-between" style={{ width: "100%" }} gap={10}>
                      <Title
                        level={3}
                        style={styles.headerTitle}
                      >
                        <Avatar onClick={() => window.location.pathname = "/shrek"} src={icon} /> דף קשר גדוד
                        1875
                      </Title>
                      <Button onClick={logout}>
                        התנתק
                      </Button>
                    </Flex>
                  </Header>
                  <Content style={styles.content}>
                    <Flex vertical gap={10}>
                      <Space>
                        <Input
                          style={{ maxWidth: 300 }}
                          onChange={(e) =>
                            setSearchText(
                              e.target.value
                            )
                          }
                          allowClear
                          placeholder="חפש"
                          prefix={<SearchOutlined />}
                        />
                        <Select allowClear placeholder="סינון פלוגה" options={Array.from(new Set(data?.map(({ company }) => company))).map(company => ({ label: company, value: company }))} onChange={setCompanyFilter} />
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
                        {data
                          ?.filter(({ company }) => companyFilter ? company === companyFilter : true)
                          ?.filter((person) =>
                            JSON.stringify(
                              Object.values(
                                person
                              )
                            )
                              .toLocaleLowerCase()
                              .includes(
                                searchText.toLocaleLowerCase()
                              )
                          )
                          ?.map((person: Person) => (
                            <Card
                              title={`${person.firstName} ${person.lastName}`}
                              actions={[
                                <EyeOutlined
                                  key="view"
                                  onClick={() =>
                                    setSelectedPerson(
                                      person
                                    )
                                  }
                                />,
                              ].filter(Boolean)}
                              style={{
                                width: isMobile
                                  ? "100%"
                                  : 300,
                              }}
                            >
                              <Flex
                                vertical
                                gap={8}
                              >
                                <Typography.Text
                                  strong
                                  type="secondary"
                                >
                                  {
                                    translations[
                                    "company"
                                    ]
                                  }
                                  :{" "}
                                  {
                                    person.company
                                  }
                                </Typography.Text>
                                <Typography.Link
                                  href={`mailto:${person.email}`}
                                >
                                  {
                                    person.email
                                  }
                                </Typography.Link>
                                <Typography.Text>
                                  {
                                    person.phone
                                  }
                                </Typography.Text>
                                {getFilteredValues(
                                  person
                                )}
                              </Flex>
                            </Card>
                          ))}
                      </Space>
                    </Flex>
                  </Content>
                  <Modal
                    title={
                      <>
                        <FormOutlined /> הוספת חייל חדש
                      </>
                    }
                    open={isModalVisible}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    width={isMobile ? "100%" : "80%"}
                    style={{
                      ...styles.modal,
                      top: isMobile ? 0 : 20,
                    }}
                    centered
                    destroyOnHidden
                  >
                    <Form form={form} layout="vertical">
                      <Card
                        title="פרטים אישיים"
                        style={styles.formSection}
                      >
                        <Row gutter={16}>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="firstName"
                              label="שם פרטי"
                              rules={[
                                {
                                  required:
                                    true,
                                  message:
                                    "נא להזין שם פרטי",
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="lastName"
                              label="שם משפחה"
                              rules={[
                                {
                                  required:
                                    true,
                                  message:
                                    "נא להזין שם משפחה",
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="company"
                              label="פלוגה"
                              rules={[
                                {
                                  required:
                                    true,
                                  message:
                                    "נא להזין פלוגה",
                                },
                              ]}
                            >
                              <InputNumber
                                style={{
                                  width: "100%",
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="email"
                              label="כתובת מייל"
                              rules={[
                                {
                                  required:
                                    true,
                                  type: "email",
                                  message:
                                    "נא להזין כתובת מייל תקינה",
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="phone"
                              label="מספר טלפון"
                              rules={[
                                {
                                  required:
                                    true,
                                  message:
                                    "נא להזין מספר טלפון",
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                          {/* <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="address"
                              label="כתובת מגורים מלאה"
                              rules={[
                                {
                                  required:
                                    true,
                                  message:
                                    "נא להזין כתובת מגורים",
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          </Col> */}
                          {/* <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="birthDate"
                              label="תאריך לידה"
                              rules={[
                                {
                                  required:
                                    true,
                                  message:
                                    "נא לבחור תאריך לידה",
                                },
                              ]}
                            >
                              <DatePicker
                                style={{
                                  width: "100%",
                                }}
                              />
                            </Form.Item>
                          </Col> */}
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="occupation"
                              label="באיזה תחום אתה עוסק?"
                              rules={[
                                {
                                  required:
                                    true,
                                  message:
                                    "נא להזין תחום עיסוק",
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    </Form>
                  </Modal>
                </Layout>
              )
            ) : null}

            <Modal
              closable={false}
              title="התחברות למערכת"
              open={!loading && loginModal}
              centered
              destroyOnClose
              footer={null}
            >
              <Flex justify="center">
                <Button
                  onClick={googleLogin}
                  icon={<GoogleOutlined />}
                >
                  <Typography.Text>
                    התחברות עם גוגל
                  </Typography.Text>
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
                  dataSource={Object.entries(
                    selectedPerson
                  ).filter(
                    ([key]) =>
                      !["id", "timestamp"].includes(
                        key
                      ) && key in translations
                  )}
                  renderItem={([key, value]) => {
                    const label =
                      translations[
                      key as keyof typeof translations
                      ] || key;
                    //@ts-ignore
                    let displayValue: React.ReactNode =
                      value;

                    if (value instanceof Timestamp) {
                      displayValue = new Date(
                        value.toDate()
                      ).toLocaleDateString("he-IL");
                    } else if (value instanceof Date) {
                      displayValue =
                        value.toLocaleDateString(
                          "he-IL"
                        );
                    } else if (Array.isArray(value)) {
                      displayValue = value.join(", ");
                    } else if (
                      typeof value === "object" &&
                      value !== null
                    ) {
                      displayValue =
                        JSON.stringify(value);
                    }

                    return (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Typography.Text strong>
                              {label}
                            </Typography.Text>
                          }
                          description={
                            <Typography.Text>
                              {displayValue ||
                                "לא צוין"}
                            </Typography.Text>
                          }
                          style={{ width: "100%" }}
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Modal>
          </>
        )}
      </ConfigProvider>
    );
};

export default LandingPage;
