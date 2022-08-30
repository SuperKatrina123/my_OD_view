import React, {useState} from 'react';
import { Layout } from 'antd';

import Header from '../../components/header';
import DeckMap from '../../components/deckmap';
import PanelPage from '../panelpage';
import { useSubscribe, useUnsubscribe } from '../../untils/usePubSub';

import './index.css';

const { Sider } = Layout;
export default function Urbanmob() {
  const [ showPanel, setShowPanel ] = useState(true);
  const unsubscribe = useUnsubscribe();   // 清除更新组件重复订阅的副作用

  // 订阅panel展开收起
  unsubscribe('showpanel');
  const updateShowPanel = useSubscribe('showpanel', function(msg, data) {
    setShowPanel(data);
  })

  return (
      <Layout>
        <Sider
        width={showPanel ? '45%' : '50px'}
        className='panel'
        >
          <Layout>
            <Header />
            <div style={showPanel ? {} : {height: '0px', overflowY:'hidden'}}></div>
            <PanelPage/>
          </Layout>
        </Sider>
        <DeckMap/>
      </Layout>
  )
}
