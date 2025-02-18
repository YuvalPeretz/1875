import type React from "react"
import { useState } from "react"
import { Table, Button, Modal, Form, Input, DatePicker, Select, InputNumber, Typography, Flex, Space, InputRef } from "antd"
import useResponsive from "./hooks/useResponsive"
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { ConfigProvider } from "antd"
import heIL from "antd/lib/locale/he_IL"

const { RangePicker } = DatePicker;

const { Option } = Select

const LandingPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  let searchInput: InputRef | null = null;
  const [data, setData] = useState<any[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

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
    onFilterDropdownOpenChange: (visible: boolean) => {
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
      // Assuming record[dataIndex] is an ISO string; compare only the date portion.
      const recordDate = record[dataIndex].substring(0, 10);
      return recordDate >= value[0] && recordDate <= value[1];
    },
  });

  const columns = [
    {
      title: "חותמת זמן",
      dataIndex: "timestamp",
      key: "timestamp",
      ...getColumnDateFilterProps("timestamp"),
    },
    {
      title: "שם פרטי",
      dataIndex: "firstName",
      key: "firstName",
      ...getColumnSearchProps("firstName"),
    },
    {
      title: "שם משפחה",
      dataIndex: "lastName",
      key: "lastName",
      ...getColumnSearchProps("lastName"),
    },
    {
      title: "פלוגה",
      dataIndex: "company",
      key: "company",
      ...getColumnSearchProps("company"),
    },
    {
      title: "כתובת מייל",
      dataIndex: "email",
      key: "email",
      ...getColumnSearchProps("email"),
    },
    {
      title: "מספר טלפון",
      dataIndex: "phone",
      key: "phone",
      ...getColumnSearchProps("phone"),
    },
    {
      title: "כתובת מגורים מלאה",
      dataIndex: "address",
      key: "address",
      ...getColumnSearchProps("address"),
    },
    {
      title: "תאריך לידה",
      dataIndex: "birthDate",
      key: "birthDate",
      ...getColumnDateFilterProps("birthDate"),
    },
    {
      title: "באיזה תחום אתה עוסק?",
      dataIndex: "occupation",
      key: "occupation",
      ...getColumnSearchProps("occupation"),
    },
    {
      title: "הגדרת תפקיד",
      dataIndex: "roleDefinition",
      key: "roleDefinition",
      ...getColumnSearchProps("roleDefinition"),
    },
    {
      title: "מקום עבודה",
      dataIndex: "workplace",
      key: "workplace",
      ...getColumnSearchProps("workplace"),
    },
    {
      title: "באיזה תחום הבת / בן זוג עוסק/ת?",
      dataIndex: "spouseOccupation",
      key: "spouseOccupation",
      ...getColumnSearchProps("spouseOccupation"),
    },
    {
      title: "יש לך תחביבים / תחומי עניין?",
      dataIndex: "hobbies",
      key: "hobbies",
      ...getColumnSearchProps("hobbies"),
      render: (hobbies: string[]) => hobbies?.join(", "),
    },
    {
      title: "האם יש ילדים? אם כן, כמה?",
      dataIndex: "childrenCount",
      key: "childrenCount",
      ...getColumnSearchProps("childrenCount"),
    },
    {
      title: "גילאי הילדים (אפשר לסמן כמה)",
      dataIndex: "childrenAges",
      key: "childrenAges",
      ...getColumnSearchProps("childrenAges"),
      render: (ages: string[]) => ages?.join(", "),
    },
    {
      title: "נשמח לשמוע מה הניע אותך להתנדב חזרה מפטור",
      dataIndex: "motivation",
      key: "motivation",
      ...getColumnSearchProps("motivation"),
    },
    {
      title: "מה הציפיות שלך מהשירות בגדוד? מה חשוב לך להשיג / לחוות?",
      dataIndex: "expectations",
      key: "expectations",
      ellipsis: true,
      ...getColumnSearchProps("expectations"),
    },
    {
      title: "האם יש צרכים / אתגרים מיוחדים שכדאי שנכיר?",
      dataIndex: "specialNeeds",
      key: "specialNeeds",
      ...getColumnSearchProps("specialNeeds"),
    },
    {
      title: "האם תרצה להשתתף בפעילות פנאי עם חיילי הפלוגה מחוץ לימי המילואים?",
      dataIndex: "participationInLeisure",
      key: "participationInLeisure",
      filters: [
        { text: "כן", value: "כן" },
        { text: "לא", value: "לא" },
        { text: "אולי", value: "אולי" },
      ],
      onFilter: (value: string, record: any) =>
        record.participationInLeisure === value,
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
    },
    {
      title:
        "האם יש תחום בו תרצה לסייע לחיילי הפלוגה / להוביל פעילות / לתרום?",
      dataIndex: "supportArea",
      key: "supportArea",
      ...getColumnSearchProps("supportArea"),
    },
    {
      title:
        "האם יש נכס ברשותך שיכול לסייע לערבי פלוגה / גדוד (בית, אולם, בריכה...)",
      dataIndex: "availableAssets",
      key: "availableAssets",
      ...getColumnSearchProps("availableAssets"),
    },
  ];

  // const columns = [
  //   {
  //     title: "חותמת זמן",
  //     ellipsis: true, 
  //     dataIndex: "timestamp",
  //     key: "timestamp",
  //   },
  //   {
  //     title: "שם פרטי",
  //     ellipsis: true, 
  //     dataIndex: "firstName",
  //     key: "firstName",
  //   },
  //   {
  //     title: "שם משפחה",
  //     ellipsis: true, 
  //     dataIndex: "lastName",
  //     key: "lastName",
  //   },
  //   {
  //     ellipsis: true, 
  //     title: "פלוגה",
  //     dataIndex: "company",
  //     key: "company",
  //   },
  //   {
  //     title: "כתובת מייל",
  //     ellipsis: true, 
  //     dataIndex: "email",
  //     key: "email",
  //   },
  //   {
  //     title: "מספר טלפון",
  //     ellipsis: true, 
  //     dataIndex: "phone",
  //     key: "phone",
  //   },
  //   {
  //     ellipsis: true, 
  //     title: "כתובת מגורים מלאה",
  //     dataIndex: "address",
  //     key: "address",
  //   },
  //   {
  //     title: "תאריך לידה",
  //     ellipsis: true, 
  //     dataIndex: "birthDate",
  //     key: "birthDate",
  //   },
  //   {
  //     title: "באיזה תחום אתה עוסק?",
  //     dataIndex: "occupation",
  //     ellipsis: true, 
  //     key: "occupation",
  //   },
  //   {
  //     title: "הגדרת תפקיד",
  //     ellipsis: true, 
  //     dataIndex: "roleDefinition",
  //     key: "roleDefinition",
  //   },
  //   {
  //     title: "מקום עבודה",
  //     ellipsis: true, 
  //     dataIndex: "workplace",
  //     key: "workplace",
  //   },
  //   {
  //     title: "באיזה תחום הבת / בן זוג עוסק/ת?",
  //     dataIndex: "spouseOccupation",
  //     ellipsis: true, 
  //     key: "spouseOccupation",
  //   },
  //   {
  //     title: "יש לך תחביבים / תחומי עניין?",
  //     dataIndex: "hobbies",
  //     key: "hobbies",
  //     ellipsis: true, 
  //     render: (hobbies: string[]) => hobbies?.join(", "),
  //   },
  //   {
  //     title: "האם יש ילדים? אם כן, כמה?",
  //     dataIndex: "childrenCount",
  //     key: "childrenCount",
  //     ellipsis: true, 
  //   },
  //   {
  //     title: "גילאי הילדים (אפשר לסמן כמה)",
  //     dataIndex: "childrenAges",
  //     key: "childrenAges",
  //     render: (ages: string[]) => ages?.join(", "),
  //     ellipsis: true, 
  //   },
  //   {
  //     title: "נשמח לשמוע מה הניע אותך להתנדב חזרה מפטור",
  //     dataIndex: "motivation",
  //     key: "motivation",
  //     ellipsis: true, 
  //   },
  //   {
  //     title: "מה הציפיות שלך מהשירות בגדוד? מה חשוב לך להשיג / לחוות?",
  //     dataIndex: "expectations",
  //     key: "expectations",
  //     ellipsis: true, 
  //   },
  //   {
  //     title: "האם יש צרכים / אתגרים מיוחדים שכדאי שנכיר?",
  //     dataIndex: "specialNeeds",
  //     key: "specialNeeds",
  //     ellipsis: true, 
  //   },
  //   {
  //     title: "האם תרצה להשתתף בפעילות פנאי עם חיילי הפלוגה מחוץ לימי המילואים?",
  //     dataIndex: "participationInLeisure",
  //     key: "participationInLeisure",
  //     ellipsis: true, 
  //   },
  //   {
  //     title: "תרצה לקחת חלק פעיל בהובלת הלכידות וחיזוק הקשרים הבין אישיים בפלוגה שלך?",
  //     dataIndex: "leadershipParticipation",
  //     key: "leadershipParticipation",
  //     ellipsis: true, 
  //   },
  //   {
  //     title: "האם יש תחום בו תרצה לסייע לחיילי הפלוגה / להוביל פעילות / לתרום?",
  //     dataIndex: "supportArea",
  //     key: "supportArea",
  //     ellipsis: true, 
  //   },
  //   {
  //     title: "האם יש נכס ברשותך שיכול לסייע לערבי פלוגה / גדוד (בית, אולם, בריכה...)",
  //     dataIndex: "availableAssets",
  //     key: "availableAssets",
  //     ellipsis: true, 
  //   },
  // ]

  const showModal = () => {
    setIsModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then((values) => {
      const newEntry = {
        ...values,
        timestamp: new Date().toISOString(),
        key: Date.now(),
      }
      setData([...data, newEntry])
      setIsModalVisible(false)
      form.resetFields()
    })
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  return (
    <ConfigProvider direction="rtl" locale={heIL}>
      <div style={{ padding: "20px", maxWidth: "100%", overflowX: "auto" }}>
        <Flex vertical>
          <Typography.Title>לכידות גדוד 1875</Typography.Title>
          <Flex>
            <Button onClick={showModal} type="primary" style={{ marginBottom: "20px" }}>
              הוסף      </Button>
          </Flex>
        </Flex>
        <Flex style={{ width: "100%", overflow: "auto" }}>
          <Table
            rowKey="key"                  // ensures each row is uniquely identified
            bordered                      // adds borders for clarity
            columns={columns}
            dataSource={data}
            pagination={isMobile ? { simple: true } : {}}
            size="small"
            scroll={{ x: "max-content" }} // enables horizontal scrolling if needed
          />      </Flex>
        <Modal
          title="הוסף שורה חדשה"
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          width={isMobile ? "100%" : "80%"}
          style={{ top: isMobile ? 0 : 20 }}
          centered            // centers the modal vertically
          destroyOnClose      // clears modal content on close for better performance
        >
          <Form form={form} layout="vertical">
            <Form.Item name="firstName" label="שם פרטי" rules={[{ required: true, message: "נא להזין שם פרטי" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="שם משפחה" rules={[{ required: true, message: "נא להזין שם משפחה" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="company" label="פלוגה" rules={[{ required: true, message: "נא להזין פלוגה" }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="כתובת מייל"
              rules={[{ required: true, type: "email", message: "נא להזין כתובת מייל תקינה" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="מספר טלפון" rules={[{ required: true, message: "נא להזין מספר טלפון" }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="address"
              label="כתובת מגורים מלאה"
              rules={[{ required: true, message: "נא להזין כתובת מגורים" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="birthDate" label="תאריך לידה" rules={[{ required: true, message: "נא לבחור תאריך לידה" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="occupation"
              label="באיזה תחום אתה עוסק?"
              rules={[{ required: true, message: "נא להזין תחום עיסוק" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="roleDefinition"
              label="הגדרת תפקיד"
              rules={[{ required: true, message: "נא להזין הגדרת תפקיד" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="workplace" label="מקום עבודה" rules={[{ required: true, message: "נא להזין מקום עבודה" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="spouseOccupation" label="באיזה תחום הבת / בן זוג עוסק/ת?">
              <Input />
            </Form.Item>
            <Form.Item name="hobbies" label="יש לך תחביבים / תחומי עניין?">
              <Select mode="tags" style={{ width: "100%" }} placeholder="בחר או הזן תחביבים">
                <Option value="ספורט">ספורט</Option>
                <Option value="קריאה">קריאה</Option>
                <Option value="מוזיקה">מוזיקה</Option>
                <Option value="טיולים">טיולים</Option>
              </Select>
            </Form.Item>
            <Form.Item name="childrenCount" label="האם יש ילדים? אם כן, כמה?">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="childrenAges" label="גילאי הילדים (אפשר לסמן כמה)">
              <Select mode="multiple" style={{ width: "100%" }} placeholder="בחר גילאים">
                <Option value="0-2">0-2</Option>
                <Option value="3-5">3-5</Option>
                <Option value="6-12">6-12</Option>
                <Option value="13-18">13-18</Option>
                <Option value="18+">18+</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="motivation"
              label="נשמח לשמוע מה הניע אותך להתנדב חזרה מפטור"
              rules={[{ required: true, message: "נא להזין מוטיבציה" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="expectations"
              label="מה הציפיות שלך מהשירות בגדוד? מה חשוב לך להשיג / לחוות?"
              rules={[{ required: true, message: "נא להזין ציפיות" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item name="specialNeeds" label="האם יש צרכים / אתגרים מיוחדים שכדאי שנכיר?">
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="participationInLeisure"
              label="האם תרצה להשתתף בפעילות פנאי עם חיילי הפלוגה מחוץ לימי המילואים?"
            >
              <Select>
                <Option value="כן">כן</Option>
                <Option value="לא">לא</Option>
                <Option value="אולי">אולי</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="leadershipParticipation"
              label="תרצה לקחת חלק פעיל בהובלת הלכידות וחיזוק הקשרים הבין אישיים בפלוגה שלך?"
            >
              <Select>
                <Option value="כן">כן</Option>
                <Option value="לא">לא</Option>
                <Option value="אולי">אולי</Option>
              </Select>
            </Form.Item>
            <Form.Item name="supportArea" label="האם יש תחום בו תרצה לסייע לחיילי הפלוגה / להוביל פעילות / לתרום?">
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="availableAssets"
              label="האם יש נכס ברשותך שיכול לסייע לערבי פלוגה / גדוד (בית, אולם, בריכה...)"
            >
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  )
}

export default LandingPage

