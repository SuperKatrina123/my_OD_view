import React, {useEffect, useState } from 'react';
import { Typography, Divider, Col, Upload, message, Switch, Table, Modal, Row, Button, Slider, Card, Form, Select, Collapse, Tooltip } from 'antd';
import {
    InfoCircleOutlined, InboxOutlined
} from '@ant-design/icons';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { connect } from 'react-redux';
import { GeoJsonLayer } from '@deck.gl/layers';


import { downloadFile } from '../../untils/downloadfile';
import { setlocations_tmp, setflows_tmp, setconfig_tmp, setcustomlayers_tmp } from '../../store/actions';

const { Dragger } = Upload;
const { Title, Paragraph, Text, Link } = Typography;
const csv = require('csvtojson')
const { Panel } = Collapse;
const { Option } = Select;

function ODView(props) {

  /*
    ---------------redux中取出变量---------------
  */

  const { setcustomlayers, setlocations, setconfig, setflows } = props;
  
  const {
    flows, locations, config, customlayers
  } = props;

  /*
      ---------------OD数据读取---------------
  */
  const [ layerNum, setLayerName ] = useState(1);
  const [tableinfo, setTableinfo] = useState({
    columns: [],
    data: [],
    count: 0,
    current: 1
  })

  const handleUploadTraj = (file) => {
    // message.loading({content:'数据读取中...', duration: 0, onClose: { onCloseFunction }});
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function(f) {
        // @ts-ignore
        const data = f.target.result;
        if (file.name.slice(-3) === 'csv') {
          let csvoption;
          // @ts-ignore
          if (data.slice(0, data.indexOf('\n')).split(',').map(f => isNaN(f[0])).indexOf(false) === -1) {
            // 有列名
            csvoption = {};
          } else {
            // 没有列名
            csvoption = {
              noheader: true
            };
          }

          // @ts-ignore
          csv(csvoption).fromString(data).then((jsonObj) => {
            setisModalVisible(true);

            const columns = [];
            Object.keys(jsonObj[0]).forEach((key) => {
              columns.push({'title': key, 'dataIndex': key, 'key': key});
            })
            
            // @ts-ignore
            setTableinfo({...tableinfo, columns, data: jsonObj});
            
            const columnsnames = columns.map(f => f.key)
            const SLON = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('slon') >= 0).indexOf(true)]
            const SLAT = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('slat') >= 0).indexOf(true)]
            const ELON = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('elon') >= 0).indexOf(true)]
            const ELAT = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('elat') >= 0).indexOf(true)]
            const COUNT = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('count') >= 0).indexOf(true)]
            form.setFieldsValue({
                SLON: typeof SLON === 'undefined' ? columnsnames[0] : SLON,
                SLAT: typeof SLAT === 'undefined' ? columnsnames[1] : SLAT,
                ELON: typeof ELON === 'undefined' ? columnsnames[2] : ELON,
                ELAT: typeof ELAT === 'undefined' ? columnsnames[3] : ELAT,
                COUNT: typeof COUNT === 'undefined' ? columnsnames[4] : COUNT,
            })
          })
        } else if (file.name.slice(-4) === 'json') {
          // @ts-ignore
          const jsondata = JSON.parse(data);
          setcustomlayers([
            ...customlayers,
            new GeoJsonLayer({
              id: 'Layer' + layerNum.toString(),
              type:jsondata.features[0].geometry.type,
              data: jsondata,
              pickable: true,
              stroked: true,
              filled: true,
              extruded: true,
              lineWidthScale: 20,
              lineWidthMinPixels: 2,
              opacity: 0.8,
              getFillColor: [180, 180, 220],
              getLineColor: [180, 180, 220],
              getPointRadius: 100,
              getLineWidth: 1,
              getElevation: 30
            })
          ])
          setLayerName(layerNum+1);
        }
      }
      message.destroy('readcsv');
    })
  }

//表单连接
const [form] = Form.useForm()
const [isModalVisible, setisModalVisible] = useState(false)

// setTraj 控制表单不可见+获取file数据
const setTraj = () => {
    setisModalVisible(false)
    // @ts-ignore
    const field = form.getFieldValue()
    processod(field, tableinfo.data)
}
//整理OD
const processod = (field, data) => {
    //提取字段
    const { SLON, SLAT, ELON, ELAT, COUNT } = field
    const locations_tmp = {}
    const flows = data.map(f => {
        const sname = f[SLON] + ',' + f[SLAT]
        const ename = f[ELON] + ',' + f[ELAT]
        if (typeof locations_tmp[sname] == 'undefined') {
            if (COUNT === '=1') {
                locations_tmp[sname] = 1
            } else {
                locations_tmp[sname] = parseFloat(f[COUNT])
            }
        } else {
            if (COUNT === '=1') {
                locations_tmp[sname] += 1
            } else {
                locations_tmp[sname] += parseFloat(f[COUNT])
            }
        }
        if (typeof locations_tmp[ename] == 'undefined') {
            if (COUNT === '=1') {
                locations_tmp[ename] = 1
            } else {
                locations_tmp[ename] = parseFloat(f[COUNT])
            }
        } else {
            if (COUNT === '=1') {
                locations_tmp[ename] += 1
            } else {
                locations_tmp[ename] += parseFloat(f[COUNT])
            }
        }
        if (COUNT === '=1') {
            return {
                origin: sname,
                dest: ename,
                count: 1
            }
        } else {
            return {
                origin: sname,
                dest: ename,
                count: parseFloat(f[COUNT])
            }
        }
    })
    const locations = []
    for (let key in locations_tmp) {
        locations.push({ id: key, count: locations_tmp[key], lon: parseFloat(key.split(',')[0]), lat: parseFloat(key.split(',')[1]) })
    }
    setmaxflow(flows.reduce((x, y) => { return x.count > y.count ? x : y }).count);
    setconfig({ ...config, maxTopFlowsDisplayNum: flows.reduce((x, y) => { return x.count > y.count ? x : y }).count });
    setflows(flows);
    setlocations(locations);
}

useEffect(() => {
    // axios请求本地json数据（需要放在public文件夹下面...）
    axios.get('./data/flows.json').then(response => {
        const flows = response.data
        axios.get('./data/locations.json').then(response => {
            const locations = response.data
            setlocations(locations)
            setflows(flows)
            setmaxflow(flows.reduce((x, y) => { return x.count > y.count ? x : y }).count)
            setconfig({ ...config, maxTopFlowsDisplayNum: flows.reduce((x, y) => { return x.count > y.count ? x : y }).count })
        })
    }).catch(err => {
        console.log('数据请求错误...', err);
    })
}, [])
/*
  ---------------设置改变---------------
*/
//#region
const [form2] = Form.useForm()
const handleconfigchange = (d) => {
    // 根据面板操作动态更新config
    setconfig({ ...config, ...d })
}
const [maxflow, setmaxflow] = useState(100)
  
return (
    <>
        <Col span={24}>
            <Card title="OD流向图" extra={<Tooltip title='Import OD data to show flow map'><InfoCircleOutlined /></Tooltip>}
                bordered={false}>
                    {/* 折叠面板 */}
                <Collapse defaultActiveKey={['ImportOD', "Settings", 'Layers']}>
                    <Panel header="导入OD数据" key="ImportOD">
                        <Row gutter={4}>
                            <Col>
                                <Dragger maxCount={1} beforeUpload={handleUploadTraj}>
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">点击或将数据拖到此处</p>
                                    <p className="ant-upload-hint">
                                    导入OD数据或geojson图层。OD数据至少需要四列，包括起点经纬度（slon、slat）与终点经纬度（elon、elat）。可以有计数列（count），如果没有计数列，则在count下拉选=1
                                    </p>
                                </Dragger>
                            </Col>
                            {/* <Button type='primary' onClick={()=>{downloadFile(flows, "flows");downloadFile(locations, "locations")}}>downloadFile</Button> */}
                        </Row>
                    </Panel>
                    {customlayers.length>0?
                    <Panel header="图层" key="Layers">
                        <Table size='small' columns={[
                            {
                                title: 'ID',
                                dataIndex: 'id',
                                key: 'id',
                                render: text => text
                            },{
                                title: '类型',
                                dataIndex: 'type',
                                key: 'type',
                                render: text => text
                            }]} dataSource={customlayers.map((layer, index) => {
                                return {
                                    id: layer.id,
                                    type:layer.props.type
                                }
                            })} />
                    </Panel>:null}
                    <Panel header="OD设置" key="Settings">
                        <Form {...{
                            labelCol: { span: 16 },
                            wrapperCol: { span: 8 },
                        }}
                            size="small"
                            name="basic"
                            layout='inline'
                            form={form2}
                            initialValues={config}
                            autoComplete="off"
                            onValuesChange={handleconfigchange}
                        >
                            <Title level={4}>基础设置</Title>
                            <Row gutter={4}>
                                <Col span={24}>
                                    <Form.Item label="颜色" name="colorScheme" key='colorScheme'>
                                        <Select>
                                            {['Blues', 'BluGrn', 'BluYl', 'BrwnYl', 'BuGn', 'BuPu', 'Burg', 'BurgYl', 'Cool', 'DarkMint', 'Emrld', 'GnBu', 'Grayish', 'Greens', 'Greys', 'Inferno', 'Magenta', 'Magma', 'Mint', 'Oranges', 'OrRd', 'OrYel', 'Peach', 'Plasma', 'PinkYl', 'PuBu', 'PuBuGn', 'PuRd', 'Purp', 'Purples', 'PurpOr', 'RdPu', 'RedOr', 'Reds', 'Sunset', 'SunsetDark', 'Teal', 'TealGrn', 'Viridis', 'Warm', 'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd'].map(v => { return <Option key={v} value={v}>{v}</Option> })}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="透明度" name="opacity" key="opacity">
                                        <Slider
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={typeof config.opacity === 'number' ? config.opacity : 0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="动画特效" name="animationEnabled" key="animationEnabled">
                                        <Switch size="small" checked={config.animationEnabled} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="显示节点" name="locationTotalsEnabled" key="locationTotalsEnabled">
                                        <Switch size="small" checked={config.locationTotalsEnabled} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="黑色模式（地图样式为light时使用）" name="darkMode" key="darkMode">
                                        <Switch size="small" checked={config.darkMode} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider />
                            <Title level={4}>聚类</Title>
                            <Row gutter={4}>
                                <Col span={24}>
                                    <Form.Item label="是否聚类" name="clusteringEnabled" key="clusteringEnabled">
                                        <Switch size="small" checked={config.clusteringEnabled} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="自动聚类参数" name="clusteringAuto" key="clusteringAuto">
                                        <Switch size="small" checked={config.clusteringAuto} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="聚类层数" name="clusteringLevel" key="clusteringLevel">
                                        <Slider
                                            min={0}
                                            max={20}
                                            step={1}
                                            value={typeof config.clusteringLevel === 'number' ? config.clusteringLevel : 0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Divider />
                                <Title level={4}>褪色</Title>

                                <Col span={24}>
                                    <Form.Item label="是否褪色" name="fadeEnabled" key="fadeEnabled">
                                        <Switch size="small" checked={config.fadeEnabled} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="褪色透明" name="fadeOpacityEnabled" key="fadeOpacityEnabled">
                                        <Switch size="small" checked={config.fadeOpacityEnabled} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="褪色比例" name="fadeAmount" key="fadeAmount">
                                        <Slider
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={typeof config.fadeAmount === 'number' ? config.fadeAmount : 0}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Panel>
                </Collapse>
            </Card>
        </Col>

        <Modal key="model" title="轨迹数据预览"
            width='80vw'
            // height='80vh'
            visible={isModalVisible} onOk={setTraj} onCancel={() => {
                setisModalVisible(false)
            }}>
            <Form
                {...{
                    labelCol: { span: 8 },
                    wrapperCol: { span: 0 },
                }}
                name="basic"
                form={form}
                initialValues={{ remember: true }}
                autoComplete="off"
            >
                <Row style={{ marginBottom: 20}}>
                    <Col span={4}>
                        <span>slon:</span>  
                        <Select defaultValue={tableinfo.columns[0]} style={{ width: 120, marginLeft: 10 }} key="slon">
                            {tableinfo.columns.map(v => <Option value={v.key} key={v.key}>{v.key}</Option> )}
                        </Select>
                    </Col>
                    <Col span={4}>
                        <span>slat:</span> 
                        <Select defaultValue={tableinfo.columns[0]} style={{ width: 120, marginLeft: 10 }} key="slat">
                                {tableinfo.columns.map(v => <Option value={v.key} key={v.key}>{v.key}</Option> )}
                        </Select>
                    </Col>
                    <Col span={4}>
                        <span>elon:</span>
                        <Select defaultValue={tableinfo.columns[0]} style={{ width: 120, marginLeft: 10 }} key="elon">
                                {tableinfo.columns.map(v => <Option value={v.key} key={v.key}>{v.key}</Option>)}
                        </Select>
                    </Col>
                    <Col span={4}>
                        <span>elat:</span>
                        <Select defaultValue={tableinfo.columns[0]} style={{ width: 120, marginLeft: 10 }} key="elat">
                            {tableinfo.columns.map(v => <Option value={v.key} key={v.key}>{v.key}</Option>)}
                        </Select>
                    </Col>
                    <Col span={4}>
                        <span>count:</span>
                        <Select defaultValue="=1" style={{ width: 120, marginLeft: 10 }} key="count">
                            {[...tableinfo.columns, { key: '=1' }].map(v => <Option value={v.key} key={v.key}>{v.key}</Option>)}
                        </Select>
                    </Col>
                </Row>
            </Form>
            <Table columns={tableinfo.columns}
                dataSource={tableinfo.data}
                rowKey={columns => nanoid()}
                scroll={{ x: '100%' }}
                size='small'
                style={{
                    'overflowX': 'auto',
                    'overflowY': 'auto'
                }} />
        </Modal>
    </>
)
}

const mapStateToProps = state => ({
  locations: state.trajReducer.locations,
  flows: state.trajReducer.flows,
  config:state.trajReducer.config,
  customlayers: state.trajReducer.customlayers,
})

const mapDispatchToProps = dispatch => {
  return {
    setlocations(data) {
      dispatch(setlocations_tmp(data));
    },
    setflows(data) {
        dispatch(setflows_tmp(data));
    },
    setconfig(data) {
        dispatch(setconfig_tmp(data));
    },
    setcustomlayers(data) {
        dispatch(setcustomlayers_tmp(data));
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ODView);



