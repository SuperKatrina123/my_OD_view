import React, { useState } from 'react';
import { Tabs, Layout, Button, Menu } from 'antd';
import ODView from '../odview';
import { useSubscribe, useUnsubscribe } from '../../untils/usePubSub';

import {
    MenuUnfoldOutlined, MenuFoldOutlined, NodeIndexOutlined
} from '@ant-design/icons';

import './index.css';

const { TabPane } = Tabs;
const { SubMenu } = Menu; 
const { Sider, Content } = Layout;
export default function PanelPage() {
  const unsubscribe = useUnsubscribe();   // 清除更新组件重复订阅的副作用

  const [ collapsed, setCollapsed ] = useState(true);
  const [ activePage, setActivePage] = useState('ODview')

  // 定义缩小sidebar的函数
  function toggleCollapsed() {
    setCollapsed(!collapsed);
  }

  function handleClick(event) {
    setActivePage(event.key)
  }

  // 订阅activepage，检测到activepage一旦改变，就更新tab
  unsubscribe('activepage')
  useSubscribe('activepage', function(msg, data) {
    setActivePage(data);
  })

  // 定义menu组件
  const menu = (<Sider
    collapsed={collapsed}
    onCollapse={toggleCollapsed}
    theme='light'
    >
        <Menu
            mode='inline'
            onClick={handleClick}
            defaultSelectedKeys={['ODview']}
            style={{
                borderRight: 0,
                'overflowX': 'hidden',
                'overflowY': 'auto',
            }}
        >
            <SubMenu  key='sub1' icon={<NodeIndexOutlined/>} title='OD view'>
                <Menu.Item key='ODview' icon={<NodeIndexOutlined/>}>OD view</Menu.Item>
            </SubMenu>
        </Menu>
        <Button type='text' onClick={toggleCollapsed} style={{margin: '10px 16px'}}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)}
        </Button>
  </Sider>)

  return (
    <Layout>
        <Content>
            <Tabs tabPosition='left' size='small' renderTabBar={() => menu} activeKey={activePage}>
                <TabPane key='ODview'>
                    <ODView/>
                </TabPane>
            </Tabs>
        </Content>
    </Layout>
  )
}
