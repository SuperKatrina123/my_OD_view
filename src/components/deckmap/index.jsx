import React, { useState, useEffect, useCallback } from 'react';
import { useInterval } from 'ahooks';
import { connect } from 'react-redux';
import DeckGL from '@deck.gl/react';
import { MapView, AmbientLight, LightingEffect, FirstPersonView, _SunLight as SunLight } from '@deck.gl/core';
import { BitmapLayer, IconLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { MapProvider, Map, ScaleControl, NavigationControl } from 'react-map-gl';
import { FlowMapLayer } from '@flowmap.gl/layers';   // flowmap
import 'mapbox-gl/src/css/mapbox-gl.css';

import { useSubscribe, usePublish , useUnsubscribe } from '../../untils/usePubSub';
import { setlocations_tmp, setflows_tmp, setconfig_tmp, setcustomlayers_tmp } from '../../store/actions';

// gotten token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoia2F0cmluYXNheWhlbGxvIiwiYSI6ImNsN2QwMHA5MzEwcG8zeXBmYWFjbGkwaTIifQ.Cyr8IW86qgQljoKPRyzNgA';

// DeckGL react component
function DeckMap(props) {
  const unsubscribe = useUnsubscribe();   // 清除更新组件重复订阅的副作用
  /*
    ---------------redux中取出变量---------------
  */

  /*
    获取state
    locations
    flows
    config
    customlayers  定制属性
  */
  const {
    flows, locations, config, customlayers
  } = props;

  // console.log(flows, locations, config, customlayers);
 

  /*
    ---------------状态维护---------------
  */
  const [viewState, setViewState ] = useState({   // 默认地图中心
    longitude: 139.691,
    latitude: 35.6011,
    zoom: 11,
    pitch: 0,
    bearing: 0,
  });

  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v10');   // 设置map底图样式
  const [fristperson_isshow, setfristperson_isshow] = useState(false);   // 第一视角
  const [ lightIntensity, setLightIntensity ] = useState(2);   // 管理光强度
  const [ lightX, setLightX ] = useState(1554937300);     // 管理光角度
  const [ angle, setAngle ] = useState(120);   // 旋转角度
  const [ flowCount, setFlowCount] = useState(0);   // flow权重
  const [ interval, setInterval ] = useState(undefined); // 时间间隔

  /*
    ---------------地图底图设置---------------
  */
    
    unsubscribe('lightintensity')
    useSubscribe('lightintensity', function (msg, data) {
      setLightIntensity(data)
    });
  
    //管理光角度X
    unsubscribe('lightx')
    useSubscribe('lightx', function (msg, data) {
      setLightX(data)
    });
  
    //地图光效
  // 地图光效
  const ambientLight = new AmbientLight({
    color: [128, 128, 0],   // rgb格式 [255, 255, 255]
    intensity: 2.0,     // number，默认为1
  })

  const sunLight = new SunLight({
    timestamp: lightX,        // number: timestamp in milliseconds
    color: [255, 255, 255],   // rgb格式 [255, 255, 255]
    intensity: lightIntensity,       // number
  });
  

  const lightingEffect = new LightingEffect({ ambientLight, sunLight});   // new LightingEffect({light0, light1, light2, ...});

  const material = {
    ambient: 0.1,
    diffuse: 0.6,
    shininess: 22,
    specularColor: [60, 64, 70]
  };

  const theme = {
    buildingColor: [255, 255, 255],
    trailColor0: [253, 128, 93],
    trailColor1: [23, 184, 190],
    material,
    effects: [lightingEffect]
  };

  const handelhover = (info, event) => {
    // console.log(info, event);
    if (info) {
        setFlowCount(info.count);
    }
  }
  /*
    ---------------图层设置---------------
  */
  const layers = [
    fristperson_isshow ? new TileLayer({
        data: `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`, 
        minZoom: 0,
        maxZoom:19,
        titleSize: 521,
        renderSubLayers: props => {
            const {
                bbox: {west, south, east, north }
            } = props.title;
            return new BitmapLayer(props, {
                data: null,
                image: props.data,
                bounds: [west, south, east, north]
            });
        }
    }) : null,

    fristperson_isshow ? new IconLayer({
        id: 'ref-point',
        data: [{
            color: [68, 142, 247],
            coords: [viewState.longitude, viewState.latitude]
        }],
        iconAtlas: './../assets/images/firstperson.png',
        iconMapping: {
            marker: { x: 0, y: 0, width: 200, height: 200, mask: true },
        },
        sizeScale: 5,
        getIcon: d => 'marker',
        getPostion: d => [...d.coords, 30],
        getSize: d => 5,
        getColor: d => d.color,
    }): null,
    ...customlayers,
    new FlowMapLayer({
      id: 'OD',
      data: { locations, flows },
      opacity: config.opacity,
      pickable: true,
      colorScheme: config.colorScheme,
      clusteringEnabled: config.clusteringEnabled,
      clusteringAuto: config.clusteringAuto,
      clusteringLevel: config.clusteringLevel,
      animationEnabled: config.animationEnabled,
      locationTotalsEnabled: config.locationTotalsEnabled,
      fadeOpacityEnabled: config.fadeOpacityEnabled,
      fadeEnabled: config.fadeEnabled,
      fadeAmount: config.fadeAmount,
      darkMode: config.darkMode,
      /*       
            locationLabelsEnabled: config.locationLabelsEnabled,
            adaptiveScalesEnabled: config.adaptiveScalesEnabled,
            highlightColor: config.highlightColor, */
      getFlowMagnitude: (flow) => flow.count || 0,
      getFlowOriginId: (flow) => flow.origin,
      getFlowDestId: (flow) => flow.dest,
      getLocationId: (loc) => loc.id,
      getLocationLat: (loc) => loc.lat,
      getLocationLon: (loc) => loc.lon,
      getLocationCentroid: (location) => [location.lon, location.lat],
      onHover: handelhover,
    })
  ];

  /*
    ---------------各种更新状态---------------
  */
  const publish = usePublish();   // 发布

  // 订阅地图样式
  unsubscribe('mapstyle');   // 清除重复订阅
  useSubscribe('mapstyle', function(mag, data) {
    setMapStyle(data);     // 更新地图样式
  })

  // 允许右键旋转视角
  useEffect(() => {
    document.getElementById('deckgl-wrapper')?.addEventListener('contextmenu', event => event.preventDefault());
  })

  //第一人称底图
  const minimapBackgroundStyle = {
    position: 'absolute',
    zIndex: -1,
    width: '100%',
    height: '100%',
    background: '#aaa',
    boxShadow: '0 0 8px 2px rgba(0,0,0,0.15)'
  };

  /*
  ---------------地图旋转按钮---------------
  */

  // region
  // 旋转的函数
  function rotate(pitch, bearing, duration) {
    setViewState({
        ...viewState,
        pitch: pitch,
        bearing: bearing,
        transitionDuration: duration,
        // transitionInterpolator: new FlyToInterpolator(),
    })
  }

  // 调用useInterval来同步旋转
  useInterval(() => {
    rotate(viewState.pitch, angle, 2000)
    setAngle(angle => angle + 30)
  }, interval, { immediate: true });

  // 旋转按钮
  function rotateCam() {
    setAngle(viewState.bearing + 30);  // 每次移动角度增加30

    // 优化：节流
    if (interval !== 2000) {
        setInterval(2000);
    } else {
        setInterval(undefined);
        setViewState(viewState);
    }
  }

  // 镜头旋转工具设置
  const cameraTools = (
    <div className='maxboxgl-ctrl-group maxboxgl-ctrl'>
        <button 
        title='Rotatecam'
        onClick={rotateCam}
        style={{opacity: interval === 2000 ? 1 : 0.2}}
        >
        <span className='iconfont icon-camrotate'/>
        </button>
    </div>
  );


  useEffect(() => {
    if (locations.length > 0) {
        setViewState({...viewState, longitude: locations[parseInt(locations.length / 2)].lon, latitude: locations[parseInt(locations.length / 2)].lat})
    }
  }, [locations]);    // 监听location更新

  function getTooltipText(info) {
    if (!info.layer) {
        
    } else {
        if (info.layer.id === 'OD') {
            if (info.object) {
                if (info.object.type === 'flow') {
                    return `Count:${info.object.count}`
                }

                if (info.object.type === 'location') {
                    return `In:${info.object.totals.incomingCount}\nOut:${info.object.totals.outgoingCount}`
                }
            }
        }
    }
  }


  const getTooltip = useCallback(info => getTooltipText(info), []);
  

  /*
    ---------------渲染地图---------------
  */
  const onViewStateChange = (newViewState) => {
    const { viewId } = newViewState;
    const nViewState = newViewState.viewState;
    if (viewId === 'firstPerson') {
        setViewState({...viewState, longitude: nViewState.longitude, latitude: nViewState.latitude, bearing: nViewState.bearing})
    } else if (viewId === 'baseMap') {
        setViewState({...viewState, longitude: nViewState.longitude, latitude: nViewState.latitude, pitch: nViewState.pitch, bearing: nViewState.bearing, zoom: nViewState.zoom})
    }
  }


  return (
    <div>
        <DeckGL
            layers={layers}
            initialViewState={{
              'baseMap': viewState, 'firstPerson': {
                ...viewState, pitch: 0, zoom: 0, position: [0, 0, 2], transitionDuration: undefined,
                transitionInterpolator: undefined
              }
            }}
            effects={theme.effects}
            controller={{ doubleClickZoom: true, inertia: true, touchRotate: true }}
            style={{ zIndex: 0 }}
            ContextProvider={MapProvider}
            onViewStateChange={onViewStateChange}
            getTooltip={getTooltip} >
            <MapView id='baseMap'
                controller={true}
                y='0%'
                height='100%'
                position={
                    [0, 0, 0]
                }
            >
                <Map
                    reuseMaps
                    key='mapboxgl-ctrl-bottom-left'
                    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                    initialViewState={{
                    longitude: -122.4,
                    latitude: 37.8,
                    zoom: 14
                }}
                style={{width: 600, height: 400}}
                    mapStyle={mapStyle}
                >
                    <div className='mapboxgl-ctrl-bottom-left' style={{bottom: '20px'}}>
                        <ScaleControl maxWidth={100} unit='metric'></ScaleControl>
                    </div>
                </Map>
                <div className='mapboxgl-ctrl-bottom-right' style={{bottom: '80px'}}>
                  {/* <NavigationControl
                      position='top-left'
                      showCompass='true'
                      showZoom='true'
                      visualizePitch='true'
                  />
                  {cameraTools} */}
                </div>
            </MapView>
            {
                fristperson_isshow && (<FirstPersonView
                    controller={{scrollZoom: false, dragRotate: true, inertia: true}}
                    far={10000}
                    focalDistance={1.5}
                    x={'68%'}
                    y={20}
                    width={'30%'}
                    height={'50%'}
                    clear={true}
                ><div style={{
                  position: 'absolute',
                  zIndex: -1,
                  width: '100%',
                  height: '100%',
                  background: '#aaa',
                  boxShadow: '0 0 8px 2px rgba(0,0,0,0.15)'
                }}></div></FirstPersonView>)
            }
    </DeckGL>
    </div>
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
    getODdataDispatch(data) {
      dispatch(setlocations_tmp(data));
      dispatch(setflows_tmp(data));
      dispatch(setconfig_tmp(data));
      dispatch(setcustomlayers_tmp(data));
    }
  }
}

// // 将UI组件包装成容器组件
export default connect(mapStateToProps, mapDispatchToProps)(DeckMap)
