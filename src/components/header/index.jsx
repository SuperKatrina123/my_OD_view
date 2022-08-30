import React, { useState } from 'react';
import { PageHeader, Menu, Dropdown, Button } from 'antd';
import { 
    DownOutlined, 
    SettingOutlined, 
    UpOutlined, 
    GlobalOutlined } from '@ant-design/icons';
import { publish } from 'pubsub-js';

// import { useSubscribe, usePublish, useUnsubscribe } from '../../untils/usePubSub';
import './index.css';

const { SubMenu } = Menu;

export default function Header(props) {
  const [ collapsed, setCollapsed ] = useState(true);

  // 缩小sidebar
  function toggleCollapsed() {
    setCollapsed(!collapsed);
    // 导航至页面
    publish('showpanel', !collapsed);
  }

  // 定义menu
  const menu = (<Menu>
    <SubMenu key='mapstyle' title='地图样式' icon={<GlobalOutlined/>}>
            <Menu.Item key="dark" onClick={() => { publish('mapstyle', "mapbox://styles/mapbox/dark-v10") }}>黑色底图</Menu.Item>
            <Menu.Item key="light" onClick={() => { publish('mapstyle', "mapbox://styles/mapbox/light-v10") }}>白色底图</Menu.Item>
            <Menu.Item key="satellite" onClick={() => { publish('mapstyle', "mapbox://styles/mapbox/satellite-v9") }}>卫星地图</Menu.Item>
            <Menu.Item key="outdoors" onClick={() => { publish('mapstyle', "mapbox://styles/mapbox/satellite-streets-v11") }}>街道</Menu.Item>
    </SubMenu>
  </Menu>)
  return (
    <div>
        {
            collapsed ? <PageHeader
                className='site-page-header'
                key='site-page-header'
                title='ODview交通出行可视化分析系统'
                subTitle=''
                avatar={{ src:require('../../assets/images/logodark_3durbanmob.png'), shape:'square'}}
                {...props}
                extra={[
                    <div key='settingsl'>
                        <Dropdown key='settings' overlay={menu} trigger={['click']}>
                            <Button key='Settingbuttom' type='text'>
                                <SettingOutlined/>
                            </Button>
                        </Dropdown>
                        <Button key='navicollapsed' type="text" onClick={toggleCollapsed}>
                            {React.createElement(collapsed ? UpOutlined : DownOutlined)}
                        </Button>
                    </div>
                ]}
                >

            </PageHeader> : <Button key='navicollapsed' type='text' onClick={toggleCollapsed}>
                {React.createElement(collapsed ? UpOutlined : DownOutlined)}
            </Button>
        }
    </div>
  )
}
